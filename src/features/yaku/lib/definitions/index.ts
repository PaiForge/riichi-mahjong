import { tanyaoDefinition } from "./tanyao";
import { pinfuDefinition } from "./pinfu";
import { iipeikoDefinition } from "./iipeiko";
import { ryanpeikouDefinition } from "./ryanpeiko";
import { sanankouDefinition } from "./sanankou";
import { suuankouDefinition } from "./suuankou";
import { sankantsuDefinition } from "./sankantsu";
import { suukantsuDefinition } from "./suukantsu";
import { toitoiDefinition } from "./toitoi";
import { chiitoitsuDefinition } from "./chiitoitsu";
import { honchanDefinition } from "./honchan";
import { junchanDefinition } from "./junchan";
import { honroutouDefinition } from "./honroutou";
import { chinroutouDefinition } from "./chinroutou";
import { shousangenDefinition } from "./shousangen";
import { daisangenDefinition } from "./daisangen";
import { tsuuiisouDefinition } from "./tsuuiisou";
import { ryuuiisouDefinition } from "./ryuuiisou";
import { shousuushiiDefinition } from "./shousuushii";
import { daisuushiiDefinition } from "./daisuushii";
import { chuurenPoutouDefinition } from "./chuuren-poutou";
import { kokushiDefinition } from "./kokushi";
import { sanshokuDoujunDefinition } from "./sanshoku-doujun";
import { sanshokuDoukouDefinition } from "./sanshoku-doukou";
import { ikkitsuukanDefinition } from "./ikkitsuukan";
import { honitsuDefinition } from "./honitsu";
import { chinitsuDefinition } from "./chinitsu";
import { hakuDefinition, hatsuDefinition, chunDefinition } from "./yakuhai";
import { menzenTsumoDefinition } from "./menzen-tsumo";
import type { YakuDefinition } from "../../types";

export * from "./tanyao";
export * from "./pinfu";
export * from "./iipeiko";
export * from "./ryanpeiko";
export * from "./sanankou";
export * from "./suuankou";
export * from "./sankantsu";
export * from "./suukantsu";
export * from "./toitoi";
export * from "./chiitoitsu";
export * from "./honchan";
export * from "./junchan";
export * from "./honroutou";
export * from "./chinroutou";
export * from "./shousangen";
export * from "./daisangen";
export * from "./tsuuiisou";
export * from "./ryuuiisou";
export * from "./shousuushii";
export * from "./daisuushii";
export * from "./chuuren-poutou";
export * from "./kokushi";
export * from "./sanshoku-doujun";
export * from "./sanshoku-doukou";
export * from "./ikkitsuukan";
export * from "./honitsu";
export * from "./chinitsu";
export * from "./yakuhai";

export const ALL_YAKU_DEFINITIONS: YakuDefinition[] = [
  tanyaoDefinition,
  pinfuDefinition,
  iipeikoDefinition,
  ryanpeikouDefinition,
  sanankouDefinition,
  suuankouDefinition,
  sankantsuDefinition,
  suukantsuDefinition,
  toitoiDefinition,
  chiitoitsuDefinition,
  honchanDefinition,
  junchanDefinition,
  honroutouDefinition,
  chinroutouDefinition,
  shousangenDefinition,
  daisangenDefinition,
  tsuuiisouDefinition,
  ryuuiisouDefinition,
  shousuushiiDefinition,
  daisuushiiDefinition,
  chuurenPoutouDefinition,
  kokushiDefinition,
  sanshokuDoujunDefinition,
  sanshokuDoukouDefinition,
  ikkitsuukanDefinition,
  honitsuDefinition,
  chinitsuDefinition,
  hakuDefinition,
  hatsuDefinition,
  chunDefinition,
  menzenTsumoDefinition,
];
