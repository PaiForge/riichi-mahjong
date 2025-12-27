import { isSuupai, kindIdToHaiType } from "../../../../core/hai";
import { HaiType } from "../../../../types";
import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const CHINITSU_YAKU: Yaku = {
  name: "Chinitsu",
  han: {
    open: 5,
    closed: 6,
  } satisfies YakuHanConfig,
};

const checkChinitsu = (hand: HouraStructure): boolean => {
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

  // 1. 字牌が含まれていないこと
  const hasJihai = allHais.some((k) => kindIdToHaiType(k) === HaiType.Jihai);
  if (hasJihai) return false;

  // 2. 数牌が全て同じ種類であること
  const suupais = allHais.filter((k) => isSuupai(k));

  // 数牌が含まれていない（字一色想定だが上記でJihaiチェック済みなので事実上ありえない）場合は不成立
  if (suupais.length === 0) return false;

  const firstSuupai = suupais[0];
  if (firstSuupai === undefined) return false;

  const firstSuupaiType = kindIdToHaiType(firstSuupai);
  const isAllSameType = suupais.every(
    (k) => kindIdToHaiType(k) === firstSuupaiType,
  );

  return isAllSameType;
};

export const chinitsuDefinition: YakuDefinition = createYakuDefinition(
  CHINITSU_YAKU,
  checkChinitsu,
);
