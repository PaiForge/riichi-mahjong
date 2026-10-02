import type { Tehai14, Toitsu } from "../../../../types";
import type { ChiitoitsuHouraStructure } from "../../types";
import { HAI_KIND_IDS } from "../../../../types";
import { countHaiKind } from "../../../../core/hai-count";
import { isTuple7 } from "../../../../utils/assertions";

/**
 * 手牌を七対子（7つの対子）として構造化する。
 */
export function getHouraStructuresForChiitoitsu(
  tehai: Tehai14,
): ChiitoitsuHouraStructure[] {
  // 七対子は門前のみ（定義によっては鳴きも許容する場合があるが、一般的には門前）
  if (tehai.exposed.length > 0) return [];

  const counts = countHaiKind(tehai.closed);

  // 全ての牌種が 0 枚か 2 枚でなければ七対子不成立。
  // 4枚使いの七対子を認めるか（ローカルルール次第だが、通常は認めない）は
  // 標準的なルールに従い、4枚あっても2対子とはみなさない実装とする。
  // ※4枚使い七対子を実装する場合は 4 枚の牌種から対子を 2 つ生成する
  if (!counts.every((count) => count === 0 || count === 2)) return [];

  const pairs = HAI_KIND_IDS.filter((kind) => counts[kind] === 2).map(
    (kind): Toitsu => ({ type: "Toitsu", hais: [kind, kind] }),
  );
  if (!isTuple7(pairs)) return [];

  return [{ type: "Chiitoitsu", pairs }];
}
