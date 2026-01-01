import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Kantsu,
  Koutsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const SANSHOKU_DOUKOU_YAKU: Yaku = {
  name: "SanshokuDoukou",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkSanshokuDoukou = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 刻子・槓子を抽出
  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  if (triplets.length < 3) {
    return false;
  }

  // 2. 刻子の組み合わせ(3つ)をチェック
  for (let i = 0; i < triplets.length; i++) {
    for (let j = i + 1; j < triplets.length; j++) {
      for (let k = j + 1; k < triplets.length; k++) {
        const t1 = triplets[i];
        const t2 = triplets[j];
        const t3 = triplets[k];

        if (!t1 || !t2 || !t3) continue;

        const id1 = t1.hais[0];
        const id2 = t2.hais[0];
        const id3 = t3.hais[0];

        // 字牌が含まれていたら対象外 (字牌ID >= 27)
        if (id1 >= 27 || id2 >= 27 || id3 >= 27) continue;

        const suit1 = Math.floor(id1 / 9);
        const suit2 = Math.floor(id2 / 9);
        const suit3 = Math.floor(id3 / 9);

        // ※ 0:萬子, 1:筒子, 2:索子
        const suits = new Set([suit1, suit2, suit3]);
        // 異なる3色でなければならない
        if (suits.size !== 3) continue;

        const num1 = id1 % 9;
        const num2 = id2 % 9;
        const num3 = id3 % 9;

        // 同じ数字でなければならない
        if (num1 === num2 && num2 === num3) {
          return true;
        }
      }
    }
  }

  return false;
};

export const sanshokuDoukouDefinition: YakuDefinition = createYakuDefinition(
  SANSHOKU_DOUKOU_YAKU,
  checkSanshokuDoukou,
);
