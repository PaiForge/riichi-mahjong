import type {
  YakuName,
  HaiKindId,
  Hansu,
  HouraStructure,
  YakuHanConfig,
  Kazehai,
  Shuntsu,
  Koutsu,
  Kantsu,
  Toitsu,
  Mentsu,
} from "../../types";

export type {
  HouraStructure,
  YakuHanConfig,
  Kazehai,
  Shuntsu,
  Koutsu,
  Kantsu,
  Toitsu,
  Mentsu,
};

export interface HouraContext {
  /** 手牌が門前かどうか（暗槓が含まれていても門前扱い） */
  readonly isMenzen: boolean;
  /** 和了牌（平和判定などに必要）。省略時は判定不能な役がある */
  readonly agariHai: HaiKindId;
  /** 場風牌 */
  readonly bakaze?: Kazehai | undefined;
  /** 自風牌 */
  readonly jikaze?: Kazehai | undefined;
}

export interface Yaku {
  readonly name: YakuName;
  /** 飜数 (喰い下がり考慮) */
  readonly han: {
    readonly open: Hansu | 0; // 鳴きあり時の飜数 (0なら不成立)
    readonly closed: Hansu; // 門前時の飜数
  };
}

/**
 * 役の成立判定関数
 * @param hand 分解された手牌構造
 * @param context 判定コンテキスト
 * @returns 成立回数 (0なら不成立、役牌などで複数成立しうる)
 */
export type YakuCheck = (hand: HouraStructure, context: HouraContext) => number;

export interface YakuDefinition {
  readonly yaku: Yaku;
  readonly isSatisfied: (
    hand: HouraStructure,
    context: HouraContext,
  ) => boolean;
  readonly getHansu: (hand: HouraStructure, context: HouraContext) => Hansu | 0;
}
