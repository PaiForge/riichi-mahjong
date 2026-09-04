export const SCORE_BASE_MANGAN = 2000;
export const SCORE_BASE_HANEMAN = 3000;
export const SCORE_BASE_BAIMAN = 4000;
export const SCORE_BASE_SANBAIMAN = 6000;
export const SCORE_BASE_YAKUMAN = 8000;

/**
 * 満貫以上の判定基準となる翻数
 *
 * "5翻" であれば符数に関わらず満貫以上が確定するため 5 を設定しています。
 *
 * Q: 4翻は満貫ではないのか？
 * A: 4翻でも符数が高ければ（40符以上など）満貫になりますが、以下のようなケースでは満貫（8000点）に届きません。
 *    - 七対子 (25符): 6400点
 *    - 門前ツモ・愚形など (30符): 7900点 (※切り上げ満貫なしの場合)
 *    - 鳴き手・ロン (30符): 7700点 (※切り上げ満貫なしの場合)
 *
 *    そのため、4翻以下の場合は計算による基本点が基準値（2000）を超えたかどうかで判定します。
 */
export const HAN_MANGAN = 5;
export const HAN_HANEMAN = 6;
export const HAN_BAIMAN = 8;
export const HAN_SANBAIMAN = 11;
export const HAN_YAKUMAN = 13;

/**
 * 満貫扱いとなる基本点の下限
 *
 * 4翻以下でも符が高く、計算による基本点がこの値に達していれば満貫とする。
 */
export const BASE_SCORE_LIMIT = 2000;

/**
 * 切り上げ満貫の対象となる基本点
 *
 * 30符4翻・60符3翻がいずれもこの基本点になる。切り上げ満貫
 * （{@link ScoreLevelRuleConfig.kiriageMangan}）が有効な場合、この値に達した
 * 手は満貫（子ロン8000・親ロン12000）として支払う。
 */
export const BASE_SCORE_KIRIAGE_MANGAN = 1920;
