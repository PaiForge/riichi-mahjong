import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Shuntsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const IKKITSUUKAN_YAKU: Yaku = {
  name: "Ikkitsuukan",
  han: {
    open: 1,
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkIkkitsuukan = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const shuntsuList = hand.fourMentsu.filter(
    (mentsu): mentsu is Shuntsu => mentsu.type === "Shuntsu",
  );

  if (shuntsuList.length < 3) {
    return false;
  }

  // 順子リストから3つの組み合わせを全てチェックし、一気通貫の条件を満たすものを探す
  // 条件:
  // 1. 3つの順子が全て同じ色（萬子、筒子、索子のいずれか）であること
  // 2. 3つの順子がそれぞれ 1-2-3, 4-5-6, 7-8-9 であること
  //    （インデックスの余りが 0, 3, 6 となること）

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

        // 全て同じ色でなければならない
        if (suit1 !== suit2 || suit2 !== suit3) continue;

        // 字牌が含まれていないかチェック（念のため）
        if (suit1 > 2) continue;

        // 数値（インデックス）を取得
        const num1 = firstHai1 % 9;
        const num2 = firstHai2 % 9;
        const num3 = firstHai3 % 9;

        // 0 (1-2-3), 3 (4-5-6), 6 (7-8-9) が揃っていれば成立
        const nums = new Set([num1, num2, num3]);
        if (nums.has(0) && nums.has(3) && nums.has(6)) {
          return true;
        }
      }
    }
  }

  return false;
};

export const ikkitsuukanDefinition: YakuDefinition = createYakuDefinition(
  IKKITSUUKAN_YAKU,
  checkIkkitsuukan,
);
