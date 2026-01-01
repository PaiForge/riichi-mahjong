import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Shuntsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const IIPEIKO_YAKU: Yaku = {
  name: "Iipeikou",
  han: {
    open: 0, // 門前限定
    closed: 1,
  } satisfies YakuHanConfig,
};

const checkIipeiko = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const shuntsuList = hand.fourMentsu.filter(
    (mentsu): mentsu is Shuntsu => mentsu.type === "Shuntsu",
  );

  // 順子が2つ未満なら一盃口はあり得ない
  if (shuntsuList.length < 2) {
    return false;
  }

  // 同じ順子が2つあるか探す
  // haisの内容比較が必要。Shuntsu.haisはソート済みであることを前提とするか、
  // ここで比較用キーを作って判定する。
  // ライブラリの仕様としてShuntsuのhaisは [T, T, T] だが順序保証は型定義上は明示されていないものの、
  // 一般的な実装として昇順になっているはず。
  // 安全のため、各順子の牌をソートした文字列などをキーにして比較する。
  // ただし、Shuntsu定義上 [T, T, T] で、順子である以上連続しているため、
  // 先頭の牌（最小の牌）が同じで、種類（萬子/筒子/索子）が同じなら同一順子とみなせる。
  // しかし HaiKindId の単純な数値比較で十分。
  // 例えば 1m, 2m, 3m の順子は [0, 1, 2]。
  // 順子の構成牌IDが完全一致するかどうかを見れば良い。

  for (let i = 0; i < shuntsuList.length; i++) {
    for (let j = i + 1; j < shuntsuList.length; j++) {
      const shuntsuA = shuntsuList[i];
      const shuntsuB = shuntsuList[j];

      if (!shuntsuA || !shuntsuB) continue;

      // 牌のID列が完全に一致するか
      const isSame =
        shuntsuA.hais[0] === shuntsuB.hais[0] &&
        shuntsuA.hais[1] === shuntsuB.hais[1] &&
        shuntsuA.hais[2] === shuntsuB.hais[2];

      if (isSame) {
        return true;
      }
    }
  }

  return false;
};

export const iipeikoDefinition: YakuDefinition = createYakuDefinition(
  IIPEIKO_YAKU,
  checkIipeiko,
);
