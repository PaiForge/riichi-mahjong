import { isSuupai, kindIdToHaiType } from "../../core/hai";
import {
  HaiKind,
  type HaiKindId,
  HaiType,
  type Kazehai,
  type Shuntsu,
  type Tehai14,
} from "../../types";
import type { HouraStructure } from "./types";

/**
 * 手牌が門前（メンゼン）かどうかを判定する。
 *
 * 門前の定義:
 * - 明刻、明順、明槓などの「晒し」が含まれていないこと。
 * - 暗槓は門前として扱う。
 *
 * @param tehai 判定対象の手牌
 * @returns 門前であれば true、そうでなければ false
 */
export function isMenzen(tehai: Tehai14): boolean {
  // exposed（副露ブロック）が空なら門前
  if (tehai.exposed.length === 0) {
    return true;
  }

  // 副露ブロックがある場合、全てが「暗槓」であれば門前とみなす
  // 暗槓の定義: typeが"Kantsu"かつfuro情報を持たない（現状のデータ構造における定義）
  return tehai.exposed.every((m) => {
    return m.type === "Kantsu" && !m.furo;
  });
}
/**
 * 指定された牌が風牌かどうかを判定する。
 *
 * @param id 判定対象の牌種ID
 * @returns 風牌（東・南・西・北）であれば true
 */
export function isKazehai(id: HaiKindId): id is Kazehai {
  return (
    id === HaiKind.Ton ||
    id === HaiKind.Nan ||
    id === HaiKind.Sha ||
    id === HaiKind.Pei
  );
}

/**
 * 順子のペア数をカウントする。
 *
 * 和了構造から順子を抽出し、先頭牌IDをキーにカウントして同一順子のペア数を算出する。
 * 一盃口 (pairCount === 1) と二盃口 (pairCount >= 2) の判定に使用。
 *
 * @param hand 和了構造（面子手のみ対応）
 * @returns 同一順子のペア数。面子手以外の場合は 0。
 */
export function countShuntsuPairs(hand: HouraStructure): number {
  if (hand.type !== "Mentsu") {
    return 0;
  }

  const shuntsuList = hand.fourMentsu.filter(
    (mentsu): mentsu is Shuntsu => mentsu.type === "Shuntsu",
  );

  const shuntsuCounts = new Map<number, number>();
  for (const shuntsu of shuntsuList) {
    const key = shuntsu.hais[0];
    const currentCount = shuntsuCounts.get(key) ?? 0;
    shuntsuCounts.set(key, currentCount + 1);
  }

  let pairCount = 0;
  for (const count of shuntsuCounts.values()) {
    pairCount += Math.floor(count / 2);
  }

  return pairCount;
}

/**
 * 一色系役（混一色・清一色）の共通判定ロジック。
 *
 * 和了構造（ホウラストラクチャ）からブロックを取得し、
 * 全牌をフラット化して字牌の有無と数牌の種類を分析する。
 *
 * @param hand 和了構造
 * @returns 分析結果。国士無双の場合は undefined を返す。
 *   - hasJihai: 字牌（字牌）が含まれるか
 *   - suupaiSuit: 数牌が1種のみの場合その牌種タイプ、複数種または数牌なしなら undefined
 */
export function analyzeIshokuPattern(
  hand: HouraStructure,
): { hasJihai: boolean; suupaiSuit: HaiType | undefined } | undefined {
  let blocks;
  if (hand.type === "Mentsu") {
    blocks = [hand.jantou, ...hand.fourMentsu];
  } else if (hand.type === "Chiitoitsu") {
    blocks = hand.pairs;
  } else {
    return undefined;
  }

  const allHais = blocks.flatMap((b) => b.hais);

  const hasJihai = allHais.some((k) => kindIdToHaiType(k) === HaiType.Jihai);

  const suupais = allHais.filter((k) => isSuupai(k));
  if (suupais.length === 0) {
    return { hasJihai, suupaiSuit: undefined };
  }

  const firstSuupai = suupais[0];
  if (firstSuupai === undefined) {
    return { hasJihai, suupaiSuit: undefined };
  }

  const firstSuupaiType = kindIdToHaiType(firstSuupai);
  const isAllSameType = suupais.every(
    (k) => kindIdToHaiType(k) === firstSuupaiType,
  );

  return {
    hasJihai,
    suupaiSuit: isAllSameType ? firstSuupaiType : undefined,
  };
}
