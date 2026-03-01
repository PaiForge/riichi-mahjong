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
export { isMenzen, isKazehai } from "./features/yaku/utils";

// =============================================================================
// Features - Parser
// =============================================================================
export { parseMspz, parseExtendedMspz } from "./features/parser";
export { isMspz, isExtendedMspz } from "./features/parser/mspz";

// =============================================================================
// Features - Score
// =============================================================================
export { calculateScoreForTehai, getPaymentTotal } from "./features/score";
