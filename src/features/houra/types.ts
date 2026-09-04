import type { HouraStructure } from "../../types";
import type { MachiType } from "../../core/machi";
import type { YakuResult } from "../yaku/types";
import type { FuResult } from "../score/lib/fu/types";

/**
 * 採用された和了解釈 (HouraInterpretation)
 *
 * 同じ牌姿でも面子分解（構造解釈）は複数ありうるため、ライブラリは高点法に
 * 従って1つの解釈を採用する。このインターフェースは、採用された解釈と
 * そこから導かれる役・符・待ちをひとまとめにしたもの。
 *
 * 役判定 (`detectYaku`) と点数計算 (`calculateScoreForTehai`) は、いずれも
 * {@link selectHouraInterpretation} が返すこの値から必要な情報を取り出すだけで
 * あり、両者が別々の解釈を採用することはない。
 */
export interface HouraInterpretation {
  /** 採用された和了構造（面子分解） */
  readonly structure: HouraStructure;
  /** 採用された構造で成立する役と翻数のリスト（ドラを含まない） */
  readonly yakuResult: YakuResult;
  /** 役の翻数合計（ドラを含まない） */
  readonly yakuHansu: number;
  /** ドラの数（構造解釈によらず一定） */
  readonly dora: number;
  /** 採用された構造に基づく符計算結果 */
  readonly fuResult: FuResult;
  /** 採用された構造における待ちの形（面子手以外は undefined） */
  readonly machiType: MachiType | undefined;
  /** 役満単位（0 = 役満役なし。{@link getYakumanMultiplier} を参照） */
  readonly yakumanMultiplier: number;
}
