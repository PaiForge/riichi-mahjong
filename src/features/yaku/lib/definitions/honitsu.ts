import { isSuupai, kindIdToHaiType } from "../../../../core/hai";
import { HaiType } from "../../../../types";
import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const HONITSU_YAKU: Yaku = {
  name: "Honitsu",
  han: {
    open: 2,
    closed: 3,
  } satisfies YakuHanConfig,
};

const checkHonitsu = (hand: HouraStructure): boolean => {
  let blocks;
  if (hand.type === "Mentsu") {
    blocks = [hand.jantou, ...hand.fourMentsu];
  } else if (hand.type === "Chiitoitsu") {
    blocks = hand.pairs;
  } else {
    return false;
  }

  // ブロック内の全ての牌をフラットな配列にする
  const allHais = blocks.flatMap((b) => b.hais);

  // 1. 字牌が少なくとも1つ含まれること（清一色の除外）
  const hasJihai = allHais.some((k) => kindIdToHaiType(k) === HaiType.Jihai);
  if (!hasJihai) return false;

  // 2. 数牌が全て同じ種類であること
  const suupais = allHais.filter((k) => isSuupai(k));

  // 数牌が含まれていない場合は字一色（または不成立）なので、ホンイツではない
  if (suupais.length === 0) return false;

  const firstSuupai = suupais[0];
  if (firstSuupai === undefined) return false;

  const firstSuupaiType = kindIdToHaiType(firstSuupai);
  const isAllSameType = suupais.every(
    (k) => kindIdToHaiType(k) === firstSuupaiType,
  );

  return isAllSameType;
};

export const honitsuDefinition: YakuDefinition = createYakuDefinition(
  HONITSU_YAKU,
  checkHonitsu,
);
