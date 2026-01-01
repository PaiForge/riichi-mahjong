export const SCORE_OYA_MULTIPLIER = 1.5; // 親は1.5倍

export const SCORE_BASE_MANGAN = 2000;
export const SCORE_BASE_HANEMAN = 3000;
export const SCORE_BASE_BAIMAN = 4000;
export const SCORE_BASE_SANBAIMAN = 6000;
export const SCORE_BASE_YAKUMAN = 8000;

/**
 * 満貫以上の判定基準となる飜数
 *
 * "5飜" であれば符数に関わらず満貫以上が確定するため 5 を設定しています。
 *
 * Q: 4飜は満貫ではないのか？
 * A: 4飜でも符数が高ければ（40符以上など）満貫になりますが、以下のようなケースでは満貫（8000点）に届きません。
 *    - 七対子 (25符): 6400点
 *    - 門前ツモ・愚形など (30符): 7900点 (※切り上げ満貫なしの場合)
 *    - 鳴き手・ロン (30符): 7700点 (※切り上げ満貫なしの場合)
 *
 *    そのため、4飜以下の場合は計算による基本点が基準値（2000）を超えたかどうかで判定します。
 */
export const HAN_MANGAN = 5;
export const HAN_HANEMAN = 6;
export const HAN_BAIMAN = 8;
export const HAN_SANBAIMAN = 11;
export const HAN_YAKUMAN = 13;

export const HAS_YAKUMAN = 13; // 便宜上の飜数
export const HAS_DOUBLE_YAKUMAN = 26;

// 切り上げ満貫の閾値 (30符4飜 = 1920 -> 2000? 60符3飜=1920)
// 一般的には 2000点(子) / 3000点(親) が満貫の最低点（ベース）
// 符計算による基本点が 2000 を超えたら満貫
export const BASE_POINT_LIMIT = 2000;
