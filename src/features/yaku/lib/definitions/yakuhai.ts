import { HaiKind, type HaiKindId } from "../../../../types";
import { createYaku } from "../builder";
import type { HouraContext, YakuDefinition } from "../../types";
import { countSpecificKoutsu } from "../helpers";

/** 役牌の翻数。三元牌・風牌とも鳴いても下がらない */
const YAKUHAI_HAN = { open: 1, closed: 1 } as const;

/**
 * 三元牌の役牌定義を生成する。
 * 対象牌の刻子・槓子が1つでもあれば成立する。
 */
function createSangenpaiDefinition(
  name: "Haku" | "Hatsu" | "Chun",
  tile: HaiKindId,
): YakuDefinition {
  return createYaku(name, YAKUHAI_HAN)
    .require((hand) => countSpecificKoutsu(hand, [tile]) > 0)
    .build();
}

export const hakuDefinition = createSangenpaiDefinition("Haku", HaiKind.Haku);
export const hatsuDefinition = createSangenpaiDefinition(
  "Hatsu",
  HaiKind.Hatsu,
);
export const chunDefinition = createSangenpaiDefinition("Chun", HaiKind.Chun);

/**
 * 風牌の役牌定義を生成する。
 *
 * どの風が役牌かは局面で決まるため、対象牌を定義時に固定せず
 * `HouraContext` から引く。連風牌（場風＝自風）の刻子は場風・自風の
 * 両方が成立し、合計 2 翻になる（役を 1 つにまとめて 2 翻としない）。
 */
function createKazeYakuhaiDefinition(
  name: "Bakaze" | "Jikaze",
  selectKaze: (context: HouraContext) => HaiKindId,
): YakuDefinition {
  return createYaku(name, YAKUHAI_HAN)
    .require(
      (hand, context) => countSpecificKoutsu(hand, [selectKaze(context)]) > 0,
    )
    .build();
}

export const bakazeDefinition = createKazeYakuhaiDefinition(
  "Bakaze",
  (context) => context.bakaze,
);
export const jikazeDefinition = createKazeYakuhaiDefinition(
  "Jikaze",
  (context) => context.jikaze,
);
