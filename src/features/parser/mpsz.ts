import { Result, ok, err } from "neverthrow";
import { MpszParseError } from "../../errors";
import type { CompletedMentsu, HaiCode, Tehai } from "../../types";
import { scanMpsz, type ScannedBlock } from "./mpsz-scanner";
import { digitToHaiCode } from "./mpsz-hai";
import { parseMentsuBlock } from "./mpsz-mentsu";

/**
 * 標準的な MPSZ 形式の文字列 (MpszString)
 *
 * 純手牌の数字列だけで構成され、面子ブロック（`[...]` `{...}` `(...)`）を
 * 含まない、Extended MPSZ として正当な文字列。`isMpsz` で絞り込む。
 */
export type MpszString = string & { readonly __brand: "MpszString" };

/**
 * Extended MPSZ 形式の文字列 (ExtendedMpszString)
 *
 * 面子ブロック（`[...]` `{...}` `(...)`）を 1 つ以上含む、Extended MPSZ として
 * 正当な文字列。`isExtendedMpsz` で絞り込む。
 */
export type ExtendedMpszString = string & {
  readonly __brand: "ExtendedMpszString";
};

/**
 * 純手牌のブロックを牌コードの列に変換する。
 */
function parseClosedBlock(
  block: ScannedBlock,
): Result<readonly HaiCode[], MpszParseError> {
  return Result.combine(
    block.tiles.map((tile) => digitToHaiCode(tile.digit, block.suit)),
  );
}

/**
 * 走査済みのブロック列を手牌に組み立てる。
 */
function buildTehai(
  blocks: readonly ScannedBlock[],
): Result<Tehai<HaiCode>, MpszParseError> {
  const closedBlocks = blocks.filter((b) => b.kind === "closed");
  const mentsuBlocks = blocks.filter((b) => b.kind !== "closed");

  return Result.combine(closedBlocks.map(parseClosedBlock)).andThen((closed) =>
    Result.combine(mentsuBlocks.map(parseMentsuBlock)).map(
      (exposed: readonly CompletedMentsu<HaiCode>[]) => ({
        closed: closed.flat(),
        exposed,
      }),
    ),
  );
}

/**
 * Extended MPSZ 文字列（例: `"123m[4-56p]{7=777^z}(1111s)"`）を解析して手牌を生成します。
 *
 * 仕様（Extended MPSZ 2.0）の第 2〜6 節をすべて検証し、1 か所でも不正があれば
 * 文字列全体を不正として `MpszParseError` を返します。赤 5（`0`）は牌コード
 * （`AkaHai`）として保持します。
 *
 * - 純手牌の牌は表記順のまま返します（並び順に意味はありません）
 * - 面子の牌は正規形の整列順（1, 2, 3, 4, 5, 0, 6, ...）に並べて返します
 * - 副露の `furo` には鳴き元 `from`・鳴いた牌 `nakiHai`、加槓では加槓牌 `kakanHai` が入ります
 *
 * 面子ブロックを含まない文字列も受理します（`parseMpsz` の上位互換）。
 * 計算系の API に渡すには `tehaiToHaiKindId` で牌種IDの手牌へ変換してください。
 *
 * @param input Extended MPSZ 形式の文字列
 * @returns 牌コードの手牌
 */
export function parseExtendedMpsz(
  input: string,
): Result<Tehai<HaiCode>, MpszParseError> {
  return scanMpsz(input).andThen(buildTehai);
}

/**
 * 標準的な MPSZ 文字列（例: `"123m405p789s11z"`）を解析して手牌を生成します。
 *
 * 面子ブロック（`[...]` `{...}` `(...)`）を含む文字列は不正として扱います。
 * 字句・数字の範囲・赤 5 の扱いは `parseExtendedMpsz` と同じです。
 *
 * @param input MPSZ 形式の文字列
 * @returns 牌コードの手牌（`exposed` は常に空）
 */
export function parseMpsz(
  input: string,
): Result<Tehai<HaiCode>, MpszParseError> {
  return scanMpsz(input).andThen((blocks) =>
    blocks.some((b) => b.kind !== "closed")
      ? err(
          new MpszParseError(
            `標準 MPSZ に面子ブロックは含められません（parseExtendedMpsz を使ってください）: ${input}`,
          ),
        )
      : buildTehai(blocks),
  );
}

/**
 * 文字列が標準的な MPSZ 形式（面子ブロックを含まず、Extended MPSZ として正当）
 * かどうかを判定します。範囲外の数字（`0z` `8z` `9z`）や使用できない文字を
 * 含む文字列は false です。
 *
 * @param input 判定対象の文字列
 * @returns 標準 MPSZ 形式であれば true
 */
export function isMpsz(input: string): input is MpszString {
  return parseMpsz(input).isOk();
}

/**
 * 文字列が Extended MPSZ 形式（面子ブロックを 1 つ以上含み、かつ正当）
 * かどうかを判定します。面子ブロックを含まない正当な文字列は、標準 MPSZ
 * （`isMpsz`）として区別するため false です。
 *
 * @param input 判定対象の文字列
 * @returns Extended MPSZ 形式であれば true
 */
export function isExtendedMpsz(input: string): input is ExtendedMpszString {
  return scanMpsz(input)
    .andThen((blocks) =>
      blocks.some((b) => b.kind !== "closed")
        ? buildTehai(blocks)
        : err(new MpszParseError("面子ブロックを含みません")),
    )
    .isOk();
}

/**
 * 文字列を MpszString に検証変換するスマートコンストラクタ。
 */
export function asMpsz(input: string): Result<MpszString, MpszParseError> {
  return parseMpsz(input).map(() => brandMpsz(input));
}

/**
 * 文字列を ExtendedMpszString に検証変換するスマートコンストラクタ。
 */
export function asExtendedMpsz(
  input: string,
): Result<ExtendedMpszString, MpszParseError> {
  return isExtendedMpsz(input)
    ? ok(input)
    : err(new MpszParseError(`Extended MPSZ 形式ではありません: ${input}`));
}

/**
 * 検証済みの文字列にブランドを付ける（isMpsz を通した後にだけ呼ぶ）。
 */
function brandMpsz(input: string): MpszString {
  // parseMpsz が Ok を返した文字列だけがここに来るため、絞り込みは常に成功する
  return isMpsz(input) ? input : brandMpsz(input);
}
