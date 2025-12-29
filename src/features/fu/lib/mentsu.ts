import type { FuResult, FuDetails } from "../types";
import type { HouraContext } from "../../yaku/types";
import type { MentsuHouraStructure } from "../../yaku/types";
import { isYaochu } from "../../../core/hai";
import { HaiKind } from "../../../types";
import { classifyMachi } from "../../../core/machi";
import {
  FU_BASE,
  FU_KOUTSU,
  FU_KANTSU,
  FU_JANTOU,
  FU_MACHI,
  FU_AGARI,
  FU_PINFU_TSUMO,
  FU_OPEN_PINFU_GLAZE,
} from "../constants";

/**
 * 面子手の符を計算する
 *
 * @param hand 面子手の構造
 * @param context 和了コンテキスト
 * @param isPinfu 平和成立フラグ
 */
export function calculateMentsuFu(
  hand: MentsuHouraStructure,
  context: HouraContext,
  isPinfu: boolean,
): FuResult {
  const details: FuDetails = {
    base: FU_BASE.NORMAL,
    mentsu: 0,
    jantou: 0,
    machi: 0,
    agari: 0,
  };

  // 1. 面子符 (MentsuFu)
  for (const mentsu of hand.fourMentsu) {
    let fu = 0;
    const isYaochuMentsu = isYaochu(mentsu.hais[0]);

    if (mentsu.type === "Koutsu") {
      // 刻子
      const openFu = isYaochuMentsu
        ? FU_KOUTSU.YAOCHU_OPEN
        : FU_KOUTSU.SUUPAI_OPEN;
      const closedFu = isYaochuMentsu
        ? FU_KOUTSU.YAOCHU_CLOSED
        : FU_KOUTSU.SUUPAI_CLOSED;

      fu = closedFu;

      // 明刻判定
      let isOpen = !!mentsu.furo;
      if (!isOpen && !context.isTsumo) {
        // ロン和了で、かつその牌を含む刻子であれば明刻扱い
        if (mentsu.hais.includes(context.agariHai)) {
          isOpen = true;
        }
      }

      if (isOpen) {
        fu = openFu;
      }
      details.mentsu += fu;
    } else if (mentsu.type === "Kantsu") {
      // 槓子
      const openFu = isYaochuMentsu
        ? FU_KANTSU.YAOCHU_OPEN
        : FU_KANTSU.SUUPAI_OPEN;
      const closedFu = isYaochuMentsu
        ? FU_KANTSU.YAOCHU_CLOSED
        : FU_KANTSU.SUUPAI_CLOSED;

      fu = closedFu;
      if (mentsu.furo) {
        fu = openFu;
      }
      details.mentsu += fu;
    }
  }

  // 2. 雀頭符 (JantouFu)
  const headHai = hand.jantou.hais[0];
  let jantouFu = 0;

  if (
    headHai === HaiKind.Haku ||
    headHai === HaiKind.Hatsu ||
    headHai === HaiKind.Chun
  ) {
    jantouFu += FU_JANTOU.YAKUHAI;
  }
  if (headHai === context.bakaze) {
    jantouFu += FU_JANTOU.YAKUHAI;
  }
  if (headHai === context.jikaze) {
    jantouFu += FU_JANTOU.YAKUHAI;
  }

  // 連風牌の加算上限
  if (jantouFu > FU_JANTOU.DOUBLE_WIND_CAP) {
    jantouFu = FU_JANTOU.DOUBLE_WIND_CAP;
  }
  details.jantou = jantouFu;

  // 3. 待ち符 (MachiFu)
  const machiType = classifyMachi(hand, context.agariHai);
  if (machiType === "Kanchan") details.machi = FU_MACHI.KANCHAN;
  else if (machiType === "Penchan") details.machi = FU_MACHI.PENCHAN;
  else if (machiType === "Tanki") details.machi = FU_MACHI.TANKI;
  else details.machi = 0; // Ryanmen, Shanpon

  // 4. 和了符 (AgariFu)
  if (context.isTsumo) {
    if (!isPinfu) {
      details.agari = FU_AGARI.TSUMO;
    }
  } else {
    if (context.isMenzen) {
      details.agari = FU_AGARI.MENZEN_RON;
    }
  }

  // 合計
  let sum =
    details.base +
    details.mentsu +
    details.jantou +
    details.machi +
    details.agari;

  // 平和ツモ例外
  if (isPinfu && context.isTsumo) {
    return { total: FU_PINFU_TSUMO, details };
  }

  // 切り上げ (喰いタン平和形など)
  if (sum === 20 && !context.isTsumo && !context.isMenzen) {
    sum = FU_OPEN_PINFU_GLAZE;
  } else {
    sum = Math.ceil(sum / 10) * 10;
  }

  return {
    total: sum,
    details,
  };
}
