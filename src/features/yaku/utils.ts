import {
  HaiKind,
  type HaiKindId,
  type Kazehai,
  type Tehai14,
} from "../../types";

/**
 * 手牌が門前（メンゼン）かどうかを判定する。
 *
 * 門前の定義:
 * - 明刻、明順、明槓などの「晒し」が含まれていないこと。
 * - 暗槓は門前として扱う。
 *
 * @param tehai 判定対象の手牌
 * @returns 門前であれば true、そうでなければ false
 */
export function isMenzen(tehai: Tehai14): boolean {
  // exposed（副露ブロック）が空なら門前
  if (tehai.exposed.length === 0) {
    return true;
  }

  // 副露ブロックがある場合、全てが「暗槓」であれば門前とみなす
  // 暗槓の定義: typeが"Kantsu"かつfuro情報を持たない（現状のデータ構造における定義）
  return tehai.exposed.every((m) => {
    return m.type === "Kantsu" && !m.furo;
  });
}
/**
 * 指定された牌が風牌かどうかを判定する。
 *
 * @param id 判定対象の牌種ID
 * @returns 風牌（東・南・西・北）であれば true
 */
export function isKazehai(id: HaiKindId): id is Kazehai {
  return (
    id === HaiKind.Ton ||
    id === HaiKind.Nan ||
    id === HaiKind.Sha ||
    id === HaiKind.Pei
  );
}
