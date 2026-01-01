import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Kantsu,
  Koutsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HouraContext } from "../../types";

const SANANKOU_YAKU: Yaku = {
  name: "Sanankou",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkSanankou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 刻子・槓子を抽出
  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  let ankouCount = 0;

  for (const triplet of triplets) {
    // 副露している刻子は暗刻ではない
    if (triplet.furo) continue;

    const isAgariHaiInTriplet = triplet.hais.includes(context.agariHai);

    // ロン和了の場合、和了牌を含む刻子は明刻扱いとなる（シャボ待ちの場合）。
    // ただし、単騎待ちの場合は暗刻扱いとなる。
    // 単騎待ちかどうかの判定: 雀頭の牌が和了牌と同じかどうか
    const isTanki = hand.jantou.hais[0] === context.agariHai;

    if (context.isTsumo) {
      // ツモなら、副露していなければ全て暗刻
      ankouCount++;
    } else {
      // ロン和了の場合
      if (isAgariHaiInTriplet) {
        // 和了牌を含む刻子の場合
        if (isTanki) {
          // 単騎待ちなら暗刻
          ankouCount++;
        } else {
          // シャボ（等の）待ちでロンした場合は明刻扱いなのでカウントしない
        }
      } else {
        // 和了牌を含まない刻子は暗刻
        ankouCount++;
      }
    }
  }

  return ankouCount >= 3;
};

export const sanankouDefinition: YakuDefinition = createYakuDefinition(
  SANANKOU_YAKU,
  checkSanankou,
);
