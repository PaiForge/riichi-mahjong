/**
 * Riichi Mahjong Library
 */

// =============================================================================
// Types & Constants
// =============================================================================
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
  Fu,
} from "./types";
export type {
  YakuResult,
  YakuName,
  Hansu,
  DetectYakuConfig,
} from "./features/yaku";
export type {
  FuRuleConfig,
  ScoreLevelRuleConfig,
  YakumanRuleConfig,
  RuleConfig,
} from "./types";
export type {
  HouraStructure,
  MentsuHouraStructure,
  ChiitoitsuHouraStructure,
  KokushiHouraStructure,
} from "./types";
export type { FuResult, FuDetails } from "./features/score/lib/fu/types";
export type {
  ScoreResult,
  ScoreDetail,
  ScoreCalculationConfig,
  CalculateScoreConfig,
  Payment,
  Ron,
  KoTsumo,
  OyaTsumo,
} from "./features/score/types";

// =============================================================================
// Errors
// =============================================================================
export {
  MahjongError,
  ShoushaiError,
  TahaiError,
  MahjongArgumentError,
  DuplicatedHaiIdError,
  InvalidHaiQuantityError,
  ChomboError,
  NoYakuError,
  MspzParseError,
} from "./errors";

// =============================================================================
// Core - Hai (Tile) Utilities
// =============================================================================
export {
  haiIdToKindId,
  kindIdToHaiType,
  haiKindToNumber,
  isSuupai,
  isYaochu,
  YAOCHU_KIND_IDS,
} from "./core/hai";

// =============================================================================
// Core - Tehai (Hand) Validation
// =============================================================================
export {
  validateTehai,
  validateTehai13,
  validateTehai14,
  isTehai13,
  isTehai14,
} from "./core/tehai";
export type { TehaiError } from "./core/tehai";

// =============================================================================
// Core - Mentsu (Meld) Validation
// =============================================================================
export {
  isValidShuntsu,
  isValidKoutsu,
  isValidKantsu,
  isValidToitsu,
  isValidTatsu,
} from "./core/mentsu";

// =============================================================================
// Core - Dora
// =============================================================================
export { getDoraNext, countDora } from "./core/dora";

// =============================================================================
// Core - Machi (Wait) Classification
// =============================================================================
export { classifyMachi } from "./core/machi";
export type { MachiType } from "./core/machi";

// =============================================================================
// Features - Shanten
// =============================================================================
export { calculateShanten } from "./features/shanten";

// =============================================================================
// Features - Machi
// =============================================================================
export { getUkeire } from "./features/machi";

// =============================================================================
// Features - Yaku
// =============================================================================
export { detectYaku } from "./features/yaku";
export { isMenzen } from "./features/yaku/utils";
export { isKazehai } from "./core/hai";

// =============================================================================
// Features - Parser
// =============================================================================
export { parseMspz, parseExtendedMspz } from "./features/parser";
export { isMspz, isExtendedMspz } from "./features/parser/mspz";
// 型ガード isMspz / isExtendedMspz が絞り込む先の型。利用側が絞り込んだ値を
// 変数や引数として保持するために必要なため公開する。
export type { MspzString, ExtendedMspzString } from "./features/parser";

// =============================================================================
// Features - Score
// =============================================================================
export {
  calculateScoreForTehai,
  calculateScore,
  getPaymentTotal,
  getYakumanMultiplier,
} from "./features/score";
