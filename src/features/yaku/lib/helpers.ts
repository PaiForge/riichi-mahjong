import type { HouraStructure, Kantsu, Koutsu, Shuntsu } from "../types";
import { type HouraContext } from "../types";
import type { HaiKindId } from "../../../types";
/**
 * 手牌の刻子・槓子のうち、暗刻の数をカウントする
 * 四暗刻・三暗刻などの判定に使用
 */
export const countAnkou = (
  hand: HouraStructure,
  context: HouraContext,
): number => {
  if (hand.type !== "Mentsu") {
    return 0;
  }

  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  let ankouCount = 0;

  for (const triplet of triplets) {
    if (triplet.furo) continue;

    const isAgariHaiInTriplet = triplet.hais.includes(context.agariHai);

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
        }
      } else {
        // 和了牌を含まない刻子は暗刻
        ankouCount++;
      }
    }
  }

  return ankouCount;
};

/**
 * 手牌枠の中で指定した牌種（HaiKindId）からなる刻子・槓子の数をカウントする
 * 大三元・小三元・大四喜・小四喜などの判定に使用
 */
export const countSpecificKoutsu = (
  hand: HouraStructure,
  targetKinds: readonly HaiKindId[],
): number => {
  if (hand.type !== "Mentsu") {
    return 0;
  }

  let count = 0;
  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  for (const triplet of triplets) {
    if (targetKinds.includes(triplet.hais[0])) {
      count++;
    }
  }

  return count;
};

/**
 * 指定した条件を満たす牌種のみで手牌が構成されているか判定する
 * 緑一色・字一色・清老頭などの判定に使用
 */
export const isAllHaisMatch = (
  hand: HouraStructure,
  predicate: (id: HaiKindId) => boolean,
): boolean => {
  if (hand.type === "Mentsu") {
    const allHais = [
      ...hand.fourMentsu.flatMap((m) => m.hais),
      ...hand.jantou.hais,
    ];
    return allHais.every(predicate);
  } else if (hand.type === "Chiitoitsu") {
    const allHais = hand.pairs.flatMap((p) => p.hais);
    return allHais.every(predicate);
  } else {
    // KokushiHouraStructure uses yaochu (and jantou which is in yaochu)
    return hand.yaochu.every(predicate);
  }
};

/**
 * 順子のリストから3つの組み合わせを全て抽出する
 * 一気通貫や三色同順などの判定に使用
 */
export const getShuntsuCombinations3 = (
  shuntsuList: readonly Shuntsu[],
): [Shuntsu, Shuntsu, Shuntsu][] => {
  const combos: [Shuntsu, Shuntsu, Shuntsu][] = [];
  for (let i = 0; i < shuntsuList.length; i++) {
    for (let j = i + 1; j < shuntsuList.length; j++) {
      for (let k = j + 1; k < shuntsuList.length; k++) {
        const s1 = shuntsuList[i];
        const s2 = shuntsuList[j];
        const s3 = shuntsuList[k];
        if (s1 && s2 && s3) {
          combos.push([s1, s2, s3]);
        }
      }
    }
  }
  return combos;
};
