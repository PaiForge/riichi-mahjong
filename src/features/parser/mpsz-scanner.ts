import { Result, ok, err } from "neverthrow";
import { MpszParseError } from "../../errors";

/** 色のサフィックス (Suit) */
export type Suit = "m" | "p" | "s" | "z";

/** 注釈 (Annotation): 方向注釈 `-` `=` `+` と加槓牌 `^` */
export type Annotation = "-" | "=" | "+" | "^";

/**
 * ブロック種別 (BlockKind)
 *
 * - closed: 純手牌の数字列（括弧の外）
 * - open: 副露 `[...]`
 * - kakan: 加槓 `{...}`
 * - ankan: 暗槓 `(...)`
 */
export type BlockKind = "closed" | "open" | "kakan" | "ankan";

/** 走査した牌 1 枚: 数字と、付いていれば注釈 */
export interface ScannedTile {
  readonly digit: number;
  readonly annotation: Annotation | undefined;
}

/** 走査したブロック: 種別・牌の列・色 */
export interface ScannedBlock {
  readonly kind: BlockKind;
  readonly tiles: readonly ScannedTile[];
  readonly suit: Suit;
}

const SUITS: readonly Suit[] = ["m", "p", "s", "z"];
const ANNOTATIONS: readonly Annotation[] = ["-", "=", "+", "^"];

/** 囲み開始文字 → ブロック種別と閉じ文字 */
const ENCLOSURE_OF: ReadonlyMap<
  string,
  { readonly kind: BlockKind; readonly closing: string }
> = new Map([
  ["[", { kind: "open", closing: "]" }],
  ["{", { kind: "kakan", closing: "}" }],
  ["(", { kind: "ankan", closing: ")" }],
]);

const CLOSING_CHARS: ReadonlySet<string> = new Set(["]", "}", ")"]);

/**
 * 文字がサフィックスかを判定する型ガード。
 */
function isSuit(char: string): char is Suit {
  return SUITS.some((s) => s === char);
}

/**
 * 文字が注釈かを判定する型ガード。
 */
function isAnnotation(char: string): char is Annotation {
  return ANNOTATIONS.some((a) => a === char);
}

/**
 * 走査の途中状態。
 *
 * `enclosure` が undefined のときは括弧の外（純手牌）を走査している。
 * `tiles` はまだサフィックスが付いていない数字列、`suit` は囲みの中で
 * 既にサフィックスを読んだ場合にその色を保持する（囲みの中はサフィックス 1 つまで）。
 */
interface ScanState {
  readonly blocks: readonly ScannedBlock[];
  readonly enclosure:
    | { readonly kind: BlockKind; readonly closing: string }
    | undefined;
  readonly tiles: readonly ScannedTile[];
  readonly suit: Suit | undefined;
}

const INITIAL_STATE: ScanState = {
  blocks: [],
  enclosure: undefined,
  tiles: [],
  suit: undefined,
};

/**
 * 位置情報付きの解析エラーを生成する。
 */
function errorAt(input: string, index: number, reason: string): MpszParseError {
  return new MpszParseError(
    `Extended MPSZ の解析に失敗しました（${index + 1} 文字目）: ${reason}: ${input}`,
  );
}

/**
 * 1 文字を読んで走査状態を進める。
 */
function step(
  state: ScanState,
  char: string,
  index: number,
  input: string,
): Result<ScanState, MpszParseError> {
  const fail = (reason: string): Result<ScanState, MpszParseError> =>
    err(errorAt(input, index, reason));

  if (char >= "0" && char <= "9") {
    if (state.suit !== undefined) {
      return fail("ブロック内にサフィックスが複数あります");
    }
    return ok({
      ...state,
      tiles: [...state.tiles, { digit: Number(char), annotation: undefined }],
    });
  }

  if (isAnnotation(char)) {
    if (state.enclosure === undefined) {
      return fail("純手牌に注釈は付けられません");
    }
    if (state.enclosure.kind === "ankan") {
      return fail("暗槓に注釈は書けません");
    }
    if (state.suit !== undefined) {
      return fail("注釈はサフィックスより前に書きます");
    }
    const last = state.tiles.at(-1);
    if (last === undefined) {
      return fail("注釈は数字の直後に書きます");
    }
    if (last.annotation !== undefined) {
      return fail("1 つの牌に注釈は 1 つまでです");
    }
    return ok({
      ...state,
      tiles: [...state.tiles.slice(0, -1), { ...last, annotation: char }],
    });
  }

  if (isSuit(char)) {
    if (state.suit !== undefined) {
      return fail("ブロック内にサフィックスが複数あります");
    }
    if (state.tiles.length === 0) {
      return fail("サフィックスの前に数字がありません");
    }
    if (state.enclosure !== undefined) {
      // 囲みの中では閉じ文字まで保留する
      return ok({ ...state, suit: char });
    }
    return ok({
      ...state,
      blocks: [
        ...state.blocks,
        { kind: "closed", tiles: state.tiles, suit: char },
      ],
      tiles: [],
    });
  }

  const enclosure = ENCLOSURE_OF.get(char);
  if (enclosure !== undefined) {
    if (state.enclosure !== undefined) {
      return fail("括弧は入れ子にできません");
    }
    if (state.tiles.length > 0) {
      return fail("括弧の前の数字列にサフィックスがありません");
    }
    return ok({ ...state, enclosure });
  }

  if (CLOSING_CHARS.has(char)) {
    if (state.enclosure?.closing !== char) {
      return fail(`対応する開き括弧のない '${char}' です`);
    }
    if (state.suit === undefined) {
      return fail("ブロック内にサフィックスがありません");
    }
    return ok({
      blocks: [
        ...state.blocks,
        { kind: state.enclosure.kind, tiles: state.tiles, suit: state.suit },
      ],
      enclosure: undefined,
      tiles: [],
      suit: undefined,
    });
  }

  return fail(`使用できない文字 '${char}' です`);
}

/**
 * Extended MPSZ 文字列を字句・構文の段階で走査し、ブロックの列に分解する。
 *
 * ここで保証するのは SPEC 第 2〜3 節（文字集合・文法）と、注釈の位置に関する
 * 構文上の制約（純手牌・暗槓に注釈がない、1 つの牌に注釈は 1 つ）だけで、
 * 数字の範囲や面子としての妥当性（第 4〜6 節）は判定しない。
 *
 * @param input Extended MPSZ 形式の文字列
 * @returns ブロックの列。構文に反していれば Err
 */
export function scanMpsz(
  input: string,
): Result<readonly ScannedBlock[], MpszParseError> {
  const chars = Array.from(input);
  const scanned = chars.reduce<Result<ScanState, MpszParseError>>(
    (acc, char, index) =>
      acc.andThen((state) => step(state, char, index, input)),
    ok(INITIAL_STATE),
  );

  return scanned.andThen((state) => {
    if (state.enclosure !== undefined) {
      return err(errorAt(input, chars.length, "括弧が閉じていません"));
    }
    if (state.tiles.length > 0) {
      return err(
        errorAt(input, chars.length, "数字列にサフィックスがありません"),
      );
    }
    return ok(state.blocks);
  });
}
