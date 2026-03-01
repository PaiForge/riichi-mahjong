import { HaiKind, HaiKindId } from "../../../../types";
import { createYaku } from "../builder";
import type {
  HouraStructure,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

function createYakuhaiDefinition(
  name: "Haku" | "Hatsu" | "Chun",
  tile: HaiKindId,
): YakuDefinition {
  const HAN_CONFIG: YakuHanConfig = { closed: 1, open: 1 };

  const check = (hand: HouraStructure): boolean => {
    if (hand.type !== "Mentsu") return false;

    for (const mentsu of hand.fourMentsu) {
      if (mentsu.type === "Koutsu" || mentsu.type === "Kantsu") {
        if (mentsu.hais[0] === tile) {
          return true;
        }
      }
    }
    return false;
  };

  return createYaku(
    name,
    HAN_CONFIG.closed,
    typeof HAN_CONFIG.open === "number" ? HAN_CONFIG.open : 0,
  )
    .require(check)
    .build();
}

export const hakuDefinition = createYakuhaiDefinition("Haku", HaiKind.Haku);
export const hatsuDefinition = createYakuhaiDefinition("Hatsu", HaiKind.Hatsu);
export const chunDefinition = createYakuhaiDefinition("Chun", HaiKind.Chun);
