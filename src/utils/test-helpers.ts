import type {
  HaiCode,
  HaiId,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
  Mentsu,
  MentsuType,
} from "../types";
import type { Result } from "neverthrow";
import { tehaiToHaiKindId, validateTehai13 } from "../core/tehai";
import { parseExtendedMpsz, parseMpsz } from "../features/parser";
import { haiCodeToKindId } from "../core/hai";
import { isValidShuntsu } from "../core/mentsu";
import { getHouraStructuresForMentsuTe } from "../features/yaku/lib/structures/mentsu-te";
import { enumerateAgariPlacements } from "../core/agari";
import { getHouraStructuresForChiitoitsu } from "../features/yaku/lib/structures/chiitoitsu";
import { isTuple2, isTuple3 } from "./assertions";
import type { DetectYakuConfig, HouraContext } from "../features/yaku/types";
import type { ScoreCalculationConfig } from "../features/score/types";
import { HaiKind } from "../types";
import type {
  Shuntsu,
  Koutsu,
  Toitsu,
  CompletedMentsu,
  HouraStructure,
  MentsuHouraStructure,
  MentsuDecomposition,
  AgariPlacement,
  ChiitoitsuHouraStructure,
} from "../types";

/**
 * テスト用の和了牌の指定 (AgariSpec)
 *
 * - 文字列（例: `"5m"`）: 和了牌だけを指定する。置き場所は列挙の先頭
 *   （雀頭 → 面子の並び順）。待ちや明暗に依存しないテスト向け
 * - `{ hai, in }`: 置き場所まで指定する。`in` は `"Jantou"` か、和了牌を入れる
 *   面子の MPSZ（例: `"345m"`）。同じ牌が複数のブロックに入る手（例:
 *   345m 345m 55m の 5m）で待ち・明暗・暗刻数を試すテストでは必ずこちらを使う
 */
export type AgariSpec = string | { readonly hai: string; readonly in: string };

/**
 * 和了牌の指定を置き場所に解決します。
 * 指定した置き場所が候補に無ければエラーをスローします。
 */
function resolveAgariPlacement(
  decomposition: MentsuDecomposition,
  spec: AgariSpec,
): AgariPlacement {
  const haiStr = typeof spec === "string" ? spec : spec.hai;
  const hai = getHaiKindId(haiStr);
  const candidates = enumerateAgariPlacements(decomposition, hai);
  const first = candidates[0];
  if (first === undefined) {
    throw new Error(`和了牌 ${haiStr} を入れられるブロックがありません`);
  }
  if (typeof spec === "string") return first;

  const found =
    spec.in === "Jantou"
      ? candidates.find((p) => p.kind === "Jantou")
      : candidates.find((p) => {
          if (p.kind !== "Mentsu") return false;
          const hais = decomposition.fourMentsu[p.index].hais;
          const expected = parseToKindIds(spec.in);
          return (
            hais.length === expected.length &&
            hais.every((h, i) => h === expected[i])
          );
        });
  if (found === undefined) {
    throw new Error(
      `和了牌 ${haiStr} を ${spec.in} に入れる置き場所がありません`,
    );
  }
  return found;
}

/**
 * 和了牌の指定が無いときの置き場所。雀頭の単騎は必ず成立するため、
 * 待ち・明暗に依存しない役のテストではこれで十分。
 */
function defaultAgariPlacement(
  decomposition: MentsuDecomposition,
): AgariPlacement {
  return { kind: "Jantou", hai: decomposition.jantou.hais[0] };
}

/**
 * 面子分解に和了牌の置き場所を与えて和了構造にします。
 * 分解の列挙結果（`getHouraStructuresForMentsuTe`）をそのまま役・符の判定に
 * 渡したいテストで使います。
 *
 * @param decomposition 置き場所未確定の面子分解
 * @param agari 和了牌の指定（{@link AgariSpec}）。省略時は雀頭の単騎
 */
export function withAgari(
  decomposition: MentsuDecomposition,
  agari?: AgariSpec,
): MentsuHouraStructure {
  return {
    ...decomposition,
    agari:
      agari === undefined
        ? defaultAgariPlacement(decomposition)
        : resolveAgariPlacement(decomposition, agari),
  };
}

/**
 * Result から値を取り出します。Err の場合はそのエラーをスローします。
 *
 * テストでは失敗が即座にテストの失敗であるべきなので、Err を握り潰さず
 * スローする。プロダクションコードでは使用しないこと（Result を返す設計を
 * 崩すため）。
 *
 * @param result 取り出し対象の Result
 * @returns Ok の場合の値
 */
export function unwrapOrThrow<T, E extends Error>(
  // Result は neverthrow のクラスであり readonly 化できないため許容する
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  result: Result<T, E>,
): T {
  if (result.isErr()) throw result.error;
  return result.value;
}

/**
 * MPSZ形式の文字列を牌種IDの配列に変換する内部ヘルパー（赤属性は落とす）。
 * パースに失敗した場合はエラーをスローします。
 */
function parseToKindIds(mpsz: string): HaiKindId[] {
  return unwrapOrThrow(parseMpsz(mpsz)).closed.map(haiCodeToKindId);
}

/**
 * テスト用の Tehai13 オブジェクトを作成します。
 * 作成時に assertTehai13 を実行し、不正な場合はエラーをスローします。
 * これにより、テストデータが正しい Tehai13 であることを保証します。
 */
export function createTehai13<T extends HaiKindId | HaiId>(
  closed: readonly T[],
): Tehai13<T> {
  const tehai: Tehai<T> = {
    closed,
    exposed: [],
  };

  return unwrapOrThrow(validateTehai13(tehai));
}

/**
 * MPSZ形式の文字列からテスト用の Tehai13 オブジェクトを作成します。
 * 13枚の手牌をMPSZ形式で指定できる便利関数です。
 *
 * @param mpszString MPSZ形式の文字列 (例: "123m456p789s11z22z")
 * @returns Tehai13 オブジェクト
 */
export function createTehai13FromMpsz(mpszString: string): Tehai13 {
  const ids = parseToKindIds(mpszString);
  return createTehai13(ids);
}

/**
 * テスト用の Mentsu オブジェクトを作成します。
 */
export function createMentsu<T extends HaiCode | HaiId>(
  type: MentsuType,
  hais: readonly T[],
): Mentsu<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { type, hais } as unknown as Mentsu<T>;
}

/**
 * テスト用の Tehai14 (和了手など) オブジェクトを作成します。
 * Extended MPSZ形式の文字列をサポートし、副露や暗槓を含む手牌を簡単に作成できます。
 * 赤 5（`0`）は牌種IDに落とします（計算系のテスト用）。
 *
 * @param mpszString Extended MPSZ形式、または通常のMPSZ形式の文字列
 * @returns Tehai14 オブジェクト
 */
export function createTehai(mpszString: string): Tehai14 {
  const tehai = tehaiToHaiKindId(unwrapOrThrow(parseExtendedMpsz(mpszString)));

  // ファクトリ関数内での as 使用は許容
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return tehai as Tehai14;
}

/**
 * MPSZ形式の文字列から七対子の和了構造を作成します。
 * 七対子として成立しない牌姿を渡した場合はエラーをスローします。
 *
 * @param mpszString MPSZ形式の文字列 (例: "11223344556677m")
 * @returns 七対子の和了構造
 */
export function createChiitoitsuStructureFromMpsz(
  mpszString: string,
): ChiitoitsuHouraStructure {
  const hands = getHouraStructuresForChiitoitsu(createTehai(mpszString));
  const hand = hands[0];
  if (hand === undefined) {
    throw new Error(`七対子として構造化できません: ${mpszString}`);
  }
  return hand;
}

/**
 * テスト用の面子手の和了構造 (MentsuHouraStructure) を作成します。
 * 牌姿から分解させるのではなく、面子の内訳を指定して構造を直接組み立てたい
 * 場合（副露の有無を作り分けるテストなど）に使用します。
 *
 * @param fourMentsu 4つの面子
 * @param jantou 雀頭
 * @param agari 和了牌の指定（{@link AgariSpec}）。省略時は雀頭の単騎
 * @returns 面子手の和了構造
 */
export function createMentsuStructure(
  fourMentsu: readonly [
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
  ],
  jantou: Toitsu,
  agari?: AgariSpec,
): MentsuHouraStructure {
  return withAgari({ type: "Mentsu", fourMentsu, jantou }, agari);
}

/**
 * テスト用の和了コンテキスト (HouraContext) を作成します。
 *
 * 役判定テストの大半は「門前・東場・南家・ドラなし」を前提に、判定対象の役に
 * 関係するフィールドだけを差し替えるため、それらを既定値として与える。
 * `agariHai` は待ちの形に依存しない役の判定では使われないダミー値。
 *
 * @param overrides 既定値から差し替えるフィールド
 * @returns 和了コンテキスト
 */
export function createHouraContext(
  overrides: Partial<HouraContext> = {},
): HouraContext {
  return {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [],
    ...overrides,
  };
}

/**
 * テスト用の役判定コンフィグ (DetectYakuConfig) を作成します。
 *
 * 既定値は {@link createHouraContext} と同じ「東場・南家・ドラなし」。
 * 和了牌は判定対象の役に応じて差し替える前提のダミー値。
 *
 * @param overrides 既定値から差し替えるフィールド
 * @returns 役判定コンフィグ
 */
export function createDetectYakuConfig(
  overrides: Partial<DetectYakuConfig> = {},
): DetectYakuConfig {
  return {
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    ...overrides,
  };
}

/**
 * テスト用の点数計算コンフィグ (ScoreCalculationConfig) を作成します。
 *
 * 既定値は {@link createDetectYakuConfig} に「子・ロン・ドラなし」を加えたもの。
 * 点数計算で必須になる `isTsumo` / `doraMarkers` を埋めるため、
 * `detectYaku` と `calculateScoreForTehai` の両方にそのまま渡せる。
 *
 * @param overrides 既定値から差し替えるフィールド
 * @returns 点数計算コンフィグ
 */
export function createScoreCalculationConfig(
  overrides: Partial<ScoreCalculationConfig> = {},
): ScoreCalculationConfig {
  return {
    ...createDetectYakuConfig(),
    isTsumo: false,
    doraMarkers: [],
    ...overrides,
  };
}

/**
 * Extended MPSZ形式の文字列から面子手（4面子1雀頭）の和了構造を作成します。
 * 面子分解が複数ありうる場合は最初の分解を使います。
 * 構造化できない牌姿を渡した場合はエラーをスローします。
 *
 * @param mpszString Extended MPSZ形式、または通常のMPSZ形式の文字列
 * @param agari 和了牌の指定（{@link AgariSpec}）。省略時は雀頭の単騎
 * @returns 面子手の和了構造
 */
export function createMentsuStructureFromMpsz(
  mpszString: string,
  agari?: AgariSpec,
): MentsuHouraStructure {
  const hands = getHouraStructuresForMentsuTe(createTehai(mpszString));
  const hand = hands[0];
  if (hand === undefined) {
    throw new Error(`面子手として構造化できません: ${mpszString}`);
  }
  return withAgari(hand, agari);
}

/**
 * MPSZ形式の文字列から HaiKindId の配列を作成します。
 * テストデータの期待値作成などで使用します。
 *
 * @param mpszString MPSZ形式の文字列 (例: "123m")
 * @returns HaiKindId の配列
 */
export function createHaiKindIds(mpszString: string): HaiKindId[] {
  return parseToKindIds(mpszString);
}

/**
 * テスト用の順子 (Shuntsu) を作成します。
 * isValidShuntsu によるバリデーションを行います。
 */
export function createShuntsu(mpsz: string): Shuntsu {
  const ids = parseToKindIds(mpsz);

  // Use core validation
  if (!isValidShuntsu(ids)) {
    throw new Error(`Invalid Shuntsu: ${mpsz}`);
  }

  // isValidShuntsu ensures it is a valid Tuple3 of HaiKindId
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const validIds = ids as unknown as [HaiKindId, HaiKindId, HaiKindId];

  return {
    type: "Shuntsu",
    hais: validIds,
  };
}

/**
 * テスト用の刻子 (Koutsu) を作成します。
 */
export function createKoutsu(mpsz: string): Koutsu {
  const ids = parseToKindIds(mpsz);
  if (!isTuple3(ids)) throw new Error(`Invalid Koutsu: ${mpsz}`);
  return {
    type: "Koutsu",
    hais: ids,
  };
}

/**
 * テスト用の対子 (Toitsu) を作成します。
 */
export function createToitsu(mpsz: string): Toitsu {
  const ids = parseToKindIds(mpsz);
  if (!isTuple2(ids)) throw new Error(`Invalid Toitsu: ${mpsz}`);
  return {
    type: "Toitsu",
    hais: ids,
  };
}

/**
 * テスト用の HaiKindId を取得します。
 */
export function getHaiKindId(mpsz: string): HaiKindId {
  const ids = parseToKindIds(mpsz);
  if (ids.length === 0) throw new Error(`Invalid HaiKindId: ${mpsz}`);
  const id = ids[0];
  if (id === undefined) throw new Error(`Internal Error: id is undefined`);
  return id;
}

/**
 * テスト用のモック手牌 (HouraStructure) を作成します。
 * 指定された面子と雀頭を使用し、残りはダミーの順子で埋めます。
 *
 * @param targetMentsu 先頭に置く面子
 * @param jantou 雀頭
 * @param agari 和了牌の指定（{@link AgariSpec}）。省略時は雀頭の単騎
 */
export function createMockHand(
  targetMentsu: CompletedMentsu,
  jantou: Toitsu,
  agari?: AgariSpec,
): HouraStructure {
  // Fill rest with dummy
  const dummyShuntsu = createShuntsu("123s");
  return withAgari(
    {
      type: "Mentsu",
      fourMentsu: [targetMentsu, dummyShuntsu, dummyShuntsu, dummyShuntsu],
      jantou,
    },
    agari,
  );
}
