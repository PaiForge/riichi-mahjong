import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HouraContext } from "../../types";

const CHUUREN_POUTOU_YAKU: Yaku = {
  name: "ChuurenPoutou",
  han: {
    open: 0, // 門前限定
    closed: 13,
  } satisfies YakuHanConfig,
};

const checkChuurenPoutou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  // 1. 門前でなければならない
  if (!context.isMenzen) {
    return false;
  }

  // 構造は Mentsu 手のみ（基本的には）
  // 構造解析結果がどうあれ、元の手牌構成が九蓮宝燈の形かどうかを確認する
  const allHais: number[] = [];

  if (hand.type === "Mentsu") {
    // 面子手の場合
    for (const mentsu of hand.fourMentsu) {
      allHais.push(...mentsu.hais);
    }
    allHais.push(...hand.jantou.hais);
  } else {
    // 九蓮宝燈は通常、面子手の特殊形として扱われることが多いが、
    // 構造解析器が Mentsu として解釈できない場合も考慮すべきか？
    // 一旦 Mentsu 型として解釈されていることを前提とする
    // （九蓮宝燈は 111+234+567+8999+α のように分解可能なので Mentsu になるはず）
    return false;
  }

  // 2. 混一色チェック（全て同じ色、字牌なし）
  if (allHais.length === 0) return false;
  const firstHai = allHais[0];
  if (firstHai === undefined) return false;

  // 字牌が含まれていたらNG
  if (firstHai >= 27) return false;

  const suit = Math.floor(firstHai / 9); // 0, 1, 2

  for (const hai of allHais) {
    if (hai >= 27) return false; // 字牌混入
    if (Math.floor(hai / 9) !== suit) return false; // 色混在
  }

  // 3. 数牌のカウントチェック
  // 1が3枚以上, 9が3枚以上, 2-8が1枚以上
  const counts = Array(9).fill(0);
  for (const hai of allHais) {
    const num = hai % 9; // 0-8
    counts[num]++;
  }

  // 1 (index 0) >= 3
  if (counts[0] < 3) return false;
  // 9 (index 8) >= 3
  if (counts[8] < 3) return false;
  // 2-8 (index 1-7) >= 1
  for (let i = 1; i <= 7; i++) {
    if (counts[i] < 1) return false;
  }

  // 合計14枚で上記を満たしていれば、必ず九蓮宝燈の形になる
  // (3+3+7 = 13枚が必須パーツで、残り1枚は何でもよいため)

  return true;
};

export const chuurenPoutouDefinition: YakuDefinition = createYakuDefinition(
  CHUUREN_POUTOU_YAKU,
  checkChuurenPoutou,
);
