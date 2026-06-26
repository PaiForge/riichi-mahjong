import type { Tehai14, HaiKindId } from "../../../../types";
import type { KokushiHouraStructure } from "../../types";
import { countHaiKind } from "../../../../core/hai-count";
import { isYaochu } from "../../../../core/hai";
import { asHaiKindId } from "../../../../utils/assertions";

/**
 * 手牌を国士無双（13種の么九牌＋雀頭）として構造化する。
 */
export function getHouraStructuresForKokushi(
  tehai: Tehai14,
): KokushiHouraStructure[] {
  // 国士無双は門前のみ
  if (tehai.exposed.length > 0) return [];

  const counts = countHaiKind(tehai.closed);
  const yaochuList: HaiKindId[] = [];
  let jantou: HaiKindId | undefined;

  for (let i = 0; i < 34; i++) {
    const kind = asHaiKindId(i);

    const count = counts[kind];

    if (count > 0) {
      if (!isYaochu(kind)) return []; // 么九牌以外が含まれていれば不成立

      if (count === 1) {
        yaochuList.push(kind);
      } else if (count === 2) {
        if (jantou !== undefined) return []; // 雀頭が既に存在すれば不成立（複数棋の雀頭候補）
        jantou = kind;
        yaochuList.push(kind);
      } else {
        return []; // 3枚以上あれば不成立
      }
    }
  }

  if (yaochuList.length !== 13 || jantou === undefined) return [];

  return [
    {
      type: "Kokushi",
      yaochu: yaochuList,
      jantou,
    },
  ];
}
