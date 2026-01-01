/**
 * Riichi Mahjong Library
 */

export { HaiKind, Tacha, FuroType, MentsuType, HaiType } from "./types";

export type {
  HaiId,
  HaiKindId,
  Furo,
  Shuntsu,
  Koutsu,
  Kantsu,
  CompletedMentsu,
  Tehai,
  Tehai13,
  Tehai14,
  Mentsu,
  IncompletedMentsu,
  Kazehai,
} from "./types";
export type { YakuResult, YakuName, Hansu } from "./features/yaku";

export { calculateShanten } from "./features/shanten";
export { getUkeire } from "./features/machi";
export { detectYaku } from "./features/yaku";
export { parseMspz, parseExtendedMspz } from "./features/parser";
export { calculateScore } from "./features/points";
export type {
  ScoreResult,
  ScoreLevel,
  ScorePayment,
  ScoreCalculationConfig,
} from "./features/points/types";
