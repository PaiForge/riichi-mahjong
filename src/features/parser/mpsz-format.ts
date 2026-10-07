import type { CompletedMentsu, Furo, HaiCode, Tacha, Tehai } from "../../types";
import { Tacha as TachaValue } from "../../types";
import {
  compareHaiCode,
  haiCodeToNotation,
  suitOrder,
  type HaiNotation,
} from "./mpsz-hai";
import type { Annotation, Suit } from "./mpsz-scanner";

/** 鳴き元 → 方向注釈 */
const DIRECTION_OF_TACHA: Readonly<Record<Tacha, Annotation>> = {
  [TachaValue.Kamicha]: "-",
  [TachaValue.Toimen]: "=",
  [TachaValue.Shimocha]: "+",
};

/** 括弧の種類の整列順（SPEC 7.4 のキー 3: `[` → `{` → `(`） */
const ENCLOSURE_ORDER = { open: 0, kakan: 1, ankan: 2 } as const;
type EnclosureKind = keyof typeof ENCLOSURE_ORDER;

const ENCLOSURE_CHARS: Readonly<
  Record<EnclosureKind, { readonly open: string; readonly close: string }>
> = {
  open: { open: "[", close: "]" },
  kakan: { open: "{", close: "}" },
  ankan: { open: "(", close: ")" },
};

/** 正規形に整列済みの、注釈付きの牌 */
interface FormattedHai {
  readonly notation: HaiNotation;
  readonly annotation: Annotation | undefined;
}

/** 正規形に整列済みの面子ブロック */
interface FormattedBlock {
  readonly suit: Suit;
  readonly enclosure: EnclosureKind;
  readonly hais: readonly FormattedHai[];
  readonly text: string;
}

/**
 * 純手牌を正規形（SPEC 7.2）に変換する。
 * 色ごとに 1 つの数字列にまとめ、m → p → s → z の順に並べる。
 */
function formatClosed(closed: readonly HaiCode[]): string {
  const sorted = [...closed].sort(compareHaiCode).map(haiCodeToNotation);
  const suits: readonly Suit[] = ["m", "p", "s", "z"];
  return suits
    .map((suit) => {
      const digits = sorted.filter((n) => n.suit === suit).map((n) => n.digit);
      return digits.length === 0 ? "" : `${digits.join("")}${suit}`;
    })
    .join("");
}

/**
 * 副露情報から、面子の各牌に付ける注釈を決める。
 *
 * 同じ牌が複数あるときは、整列済みの並びの先頭から順に方向注釈、`^` を
 * 割り当てる。これにより SPEC 7.3 の「方向注釈付き → `^` 付き → 注釈なし」
 * の順が保たれる。
 */
function annotateHais(
  hais: readonly HaiCode[],
  furo: Furo<HaiCode> | undefined,
): readonly FormattedHai[] {
  const sorted = [...hais].sort(compareHaiCode);
  if (furo === undefined) {
    return sorted.map((code) => ({
      notation: haiCodeToNotation(code),
      annotation: undefined,
    }));
  }

  const direction = DIRECTION_OF_TACHA[furo.from];
  const nakiIndex = sorted.indexOf(furo.nakiHai);
  const kakanIndex =
    furo.type === "Kakan"
      ? sorted.findIndex((code, i) => code === furo.kakanHai && i !== nakiIndex)
      : -1;

  return sorted.map((code, i) => ({
    notation: haiCodeToNotation(code),
    annotation:
      i === nakiIndex ? direction : i === kakanIndex ? "^" : undefined,
  }));
}

/**
 * 面子ブロックの括弧の種類を決める。
 * 副露（チー・ポン・大明槓）は `[...]`、加槓は `{...}`、副露情報のない槓子は `(...)`。
 */
function enclosureOf(mentsu: CompletedMentsu<HaiCode>): EnclosureKind {
  if (mentsu.furo === undefined) return "ankan";
  return mentsu.furo.type === "Kakan" ? "kakan" : "open";
}

/**
 * 面子ブロックを正規形（SPEC 7.3）に変換する。
 */
function formatBlock(mentsu: CompletedMentsu<HaiCode>): FormattedBlock {
  const hais = annotateHais(mentsu.hais, mentsu.furo);
  const enclosure = enclosureOf(mentsu);
  const first = hais[0];
  const suit: Suit = first === undefined ? "m" : first.notation.suit;
  const body = hais
    .map((h) => `${h.notation.digit}${h.annotation ?? ""}`)
    .join("");
  const { open, close } = ENCLOSURE_CHARS[enclosure];
  return { suit, enclosure, hais, text: `${open}${body}${suit}${close}` };
}

/**
 * 数字列を SPEC 7.1 の順で辞書式に比較する。一方が他方の接頭辞なら短い方が先。
 */
function compareRanks(a: readonly number[], b: readonly number[]): number {
  const common = Math.min(a.length, b.length);
  for (let i = 0; i < common; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}

/**
 * 面子ブロックを SPEC 7.4 のキー（色 → 数字列 → 括弧の種類 → 文字列全体）で比較する。
 */
function compareBlocks(a: FormattedBlock, b: FormattedBlock): number {
  return (
    suitOrder(a.suit) - suitOrder(b.suit) ||
    compareRanks(
      a.hais.map((h) => h.notation.rank),
      b.hais.map((h) => h.notation.rank),
    ) ||
    ENCLOSURE_ORDER[a.enclosure] - ENCLOSURE_ORDER[b.enclosure] ||
    (a.text < b.text ? -1 : a.text > b.text ? 1 : 0)
  );
}

/**
 * 手牌を Extended MPSZ の正規形（SPEC 第 7 節）の文字列に変換します。
 *
 * 同じ手牌を表す `Tehai` は必ず同じ文字列になるため、手牌の等値比較や
 * 保存のキーとして使えます。`parseExtendedMpsz` の逆変換で、
 * `parseExtendedMpsz(formatMpsz(tehai))` は `tehai` と同じ手牌を返します。
 *
 * - 純手牌は色ごとにまとめ、m → p → s → z、色の中では 1, 2, 3, 4, 5, 0, 6, 7, 8, 9 の順
 * - 面子ブロックは純手牌の後ろに、色 → 数字列 → 括弧の種類 → 文字列全体の順で整列
 * - 副露（チー・ポン・大明槓）は `[...]`、加槓は `{...}`、副露情報のない槓子は `(...)`
 *
 * 牌種ID（`HaiKindId`）の手牌はそのまま渡せます（赤 5 を含まない手牌として
 * 書き出します）。
 *
 * この関数は `Tehai` を検証しません。面子の構成と副露情報が整合していない
 * 手牌（例: 鳴いた牌が面子に含まれない）を渡すと、Extended MPSZ として
 * 不正な文字列を返すことがあります。
 *
 * @param tehai 手牌（牌コードまたは牌種ID）
 * @returns 正規形の Extended MPSZ 文字列
 */
export function formatMpsz(tehai: Tehai<HaiCode>): string {
  const blocks = tehai.exposed.map(formatBlock).sort(compareBlocks);
  return formatClosed(tehai.closed) + blocks.map((b) => b.text).join("");
}
