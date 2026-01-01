import { createYakuDefinition } from "../../factory";

import type {
  HouraStructure,
  Shuntsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const SANSHOKU_DOUJUN_YAKU: Yaku = {
  name: "SanshokuDoujun",
  han: {
    open: 1,
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkSanshokuDoujun = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const shuntsuList = hand.fourMentsu.filter(
    (mentsu): mentsu is Shuntsu => mentsu.type === "Shuntsu",
  );

  if (shuntsuList.length < 3) {
    return false;
  }

  // 順子リストから3つの組み合わせを全てチェックし、三色同順の条件を満たすものを探す
  // 条件:
  // 1. 3つの順子がそれぞれ異なる色（萬子、筒子、索子）であること
  // 2. 3つの順子の構成数字が同じであること（例: 123m, 123p, 123s）

  // ヘルパーロジック:
  // HaiKindId の範囲: 0-8 (ManZu), 9-17 (PinZu), 18-26 (SouZu)
  // 9で割った商が色（0, 1, 2）、余りが数値（0-8）を表す

  for (let i = 0; i < shuntsuList.length; i++) {
    for (let j = i + 1; j < shuntsuList.length; j++) {
      for (let k = j + 1; k < shuntsuList.length; k++) {
        const s1 = shuntsuList[i];
        const s2 = shuntsuList[j];
        const s3 = shuntsuList[k];

        if (!s1 || !s2 || !s3) continue;

        const firstHai1 = s1.hais[0];
        const firstHai2 = s2.hais[0];
        const firstHai3 = s3.hais[0];

        const suit1 = Math.floor(firstHai1 / 9);
        const suit2 = Math.floor(firstHai2 / 9);
        const suit3 = Math.floor(firstHai3 / 9);

        // 異なる色（0, 1, 2）でなければならない
        const suits = new Set([suit1, suit2, suit3]);
        if (suits.size !== 3) continue;

        // 全て数牌（0, 1, 2）でなければならない
        // ※通常、Shuntsuに字牌は含まれないが、念のためチェック
        if (suit1 > 2 || suit2 > 2 || suit3 > 2) continue;

        // 数値（インデックス）が一致するかチェック
        const num1 = firstHai1 % 9;
        const num2 = firstHai2 % 9;
        const num3 = firstHai3 % 9;

        if (num1 === num2 && num2 === num3) {
          return true;
        }
      }
    }
  }

  return false;
};

export const sanshokuDoujunDefinition: YakuDefinition = createYakuDefinition(
  SANSHOKU_DOUJUN_YAKU,
  checkSanshokuDoujun,
);
