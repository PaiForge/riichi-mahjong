import type { HaiKindId } from "./hai";
import type { CompletedMentsu, Toitsu } from "./mentsu";

/** 4面子のうちの位置（`fourMentsu` の添字） */
export type MentsuIndex = 0 | 1 | 2 | 3;

/**
 * 和了牌の置き場所 (AgariPlacement)
 *
 * 和了牌が雀頭と4面子のどのブロックを完成させたかを表す。同じ面子分解でも
 * 置き場所によって待ちの形（単騎・両面など）、ロン時の刻子の明暗、暗刻の
 * 数が変わり、役・符・点数が変わる。
 *
 * `hai` は和了牌そのもの。順子の中での待ち（両面・嵌張・辺張）は和了牌が
 * 順子のどの位置にあるかで決まるため、ブロックの位置だけでは足りない。
 * ライブラリが生成する和了形では、和了コンテキストの `agariHai` と必ず一致する。
 */
export type AgariPlacement =
  | {
      /** 雀頭で和了した（単騎待ち） */
      readonly kind: "Jantou";
      readonly hai: HaiKindId;
    }
  | {
      /** `fourMentsu[index]` の面子で和了した */
      readonly kind: "Mentsu";
      readonly index: MentsuIndex;
      readonly hai: HaiKindId;
    };

/**
 * 面子手の和了構造 (MentsuHouraStructure)
 *
 * 4面子1雀頭の形で和了した場合の構造。面子分解に加えて、和了牌の置き場所
 * （{@link AgariPlacement}）まで確定した「和了形」を表す。
 *
 * 置き場所を必須にしているのは、待ち・明暗・暗刻数の判定がすべてここから
 * 導かれるため。和了牌を含むブロックを改めて探す判定経路を残すと、置き場所が
 * 複数ある手（例: 345m 345m 55m の 5m）で判定ごとに別のブロックを選びうる。
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
  /** 和了牌の置き場所 */
  readonly agari: AgariPlacement;
}

/**
 * 面子手の分解 (MentsuDecomposition)
 *
 * 和了牌の置き場所が未確定の 4面子1雀頭。面子分解の列挙の途中結果であり、
 * 置き場所を展開して {@link MentsuHouraStructure} にしてから役・符の判定に
 * 渡す。公開 API には現れない。
 */
export type MentsuDecomposition = Omit<MentsuHouraStructure, "agari">;

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

/**
 * 和了形の分解 (HouraDecomposition)
 *
 * 面子手だけ和了牌の置き場所が未確定（{@link MentsuDecomposition}）。
 * 七対子・国士無双は置き場所で役・符が変わらないため和了構造そのもの。
 */
export type HouraDecomposition =
  | MentsuDecomposition
  | ChiitoitsuHouraStructure
  | KokushiHouraStructure;
