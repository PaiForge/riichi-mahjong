import type { HaiKindId } from "./hai";
import type { CompletedMentsu, Toitsu } from "./mentsu";

/**
 * 面子手の和了構造 (MentsuHouraStructure)
 *
 * 4面子1雀頭の形で和了した場合の構造。
 */
export interface MentsuHouraStructure {
  readonly type: "Mentsu";
  readonly fourMentsu: readonly [
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
  ];
  readonly jantou: Toitsu;
}

/**
 * 七対子の和了構造 (ChiitoitsuHouraStructure)
 *
 * 7つの対子で和了した場合の構造。
 */
export interface ChiitoitsuHouraStructure {
  readonly type: "Chiitoitsu";
  readonly pairs: readonly [
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
  ];
}

/**
 * 国士無双の和了構造 (KokushiHouraStructure)
 *
 * 13種の么九牌で和了した場合の構造。
 */
export interface KokushiHouraStructure {
  readonly type: "Kokushi";
  /** 13種類の么九牌（重複なし） */
  readonly yaochu: readonly HaiKindId[];
  /** 雀頭となる牌の種類 */
  readonly jantou: HaiKindId;
}

/**
 * 和了構造 (HouraStructure)
 *
 * 面子手、七対子、国士無双のいずれかの和了構造。
 */
export type HouraStructure =
  | MentsuHouraStructure
  | ChiitoitsuHouraStructure
  | KokushiHouraStructure;
