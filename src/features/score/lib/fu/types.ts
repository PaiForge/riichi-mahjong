/**
 * 符の構成要素 (FuDetails)
 *
 * 符計算の内訳を保持するインターフェース。
 */
export interface FuDetails {
  /**
   * 符底 (FuTei)
   *
   * 一般的な和了形: 20符
   * 七対子: 25符
   */
  readonly base: 20 | 25;

  /**
   * 面子符の合計 (MentsuFu)
   *
   * 刻子・槓子による加算符。順子は0符。
   */
  readonly mentsu: number;

  /**
   * 雀頭符 (JantouFu)
   *
   * 役牌の対子による加算符。
   */
  readonly jantou: number;

  /**
   * 待ち符 (MachiFu)
   *
   * 単騎・嵌張・辺張待ちによる加算符（2符）。
   */
  readonly machi: number;

  /**
   * 和了符 (AgariFu)
   *
   * ツモ和了: 2符
   * 門前ロン: 10符
   */
  readonly agari: number;
}

/**
 * 符計算結果 (FuResult)
 */
export interface FuResult {
  /**
   * 最終的な符数 (Total)
   *
   * 内訳の合計を10符単位で切り上げたもの。
   * (例: 22符 -> 30符)
   */
  readonly total: number;

  /**
   * 計算の内訳
   */
  readonly details: FuDetails;
}
