import type { Tehai14 } from "../../../../types";
import type { KokushiHouraStructure } from "../../types";
import { HAI_KIND_IDS } from "../../../../types";
import { countHaiKind } from "../../../../core/hai-count";
import { isYaochu } from "../../../../core/hai";

/**
 * 手牌を国士無双（13種の么九牌＋雀頭）として構造化する。
 */
export function getHouraStructuresForKokushi(
  tehai: Tehai14,
): KokushiHouraStructure[] {
  // 国士無双は門前のみ
  if (tehai.exposed.length > 0) return [];

  const counts = countHaiKind(tehai.closed);
  const presentKinds = HAI_KIND_IDS.filter((kind) => counts[kind] > 0);

  // 么九牌以外が含まれていれば不成立
  if (!presentKinds.every((kind) => isYaochu(kind))) return [];
  // 3枚以上ある牌種があれば不成立
  if (presentKinds.some((kind) => counts[kind] >= 3)) return [];

  // 雀頭（2枚ある牌種）はちょうど1種でなければならない
  const pairKinds = presentKinds.filter((kind) => counts[kind] === 2);
  const jantou = pairKinds[0];
  if (pairKinds.length !== 1 || jantou === undefined) return [];

  // 13種の么九牌が揃っていなければ不成立
  if (presentKinds.length !== 13) return [];

  return [{ type: "Kokushi", yaochu: presentKinds, jantou }];
}
