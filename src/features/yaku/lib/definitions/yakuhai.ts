import { HaiKind, type HaiKindId } from "../../../../types";
import { createYaku } from "../builder";
import type { YakuDefinition } from "../../types";
import { countSpecificKoutsu } from "../helpers";

/**
 * 三元牌の役牌定義を生成する。
 * 対象牌の刻子・槓子が1つでもあれば成立する。
 */
function createYakuhaiDefinition(
  name: "Haku" | "Hatsu" | "Chun",
  tile: HaiKindId,
): YakuDefinition {
  return createYaku(name, { open: 1, closed: 1 })
    .require((hand) => countSpecificKoutsu(hand, [tile]) > 0)
    .build();
}

export const hakuDefinition = createYakuhaiDefinition("Haku", HaiKind.Haku);
export const hatsuDefinition = createYakuhaiDefinition("Hatsu", HaiKind.Hatsu);
export const chunDefinition = createYakuhaiDefinition("Chun", HaiKind.Chun);
