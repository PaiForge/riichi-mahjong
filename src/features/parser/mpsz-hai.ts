import { Result, ok, err } from "neverthrow";
import { MpszParseError } from "../../errors";
import { AkaHai, HAI_KIND_IDS, HaiKind, type HaiCode } from "../../types";
import { haiCodeToKindId, isAkaHai, kindIdToHaiType } from "../../core/hai";
import type { Suit } from "./mpsz-scanner";

/** サフィックスに対応する牌種IDの起点（その色の 1 の牌） */
const SUIT_BASE: Readonly<Record<Suit, HaiCode>> = {
  m: HaiKind.ManZu1,
  p: HaiKind.PinZu1,
  s: HaiKind.SouZu1,
  z: HaiKind.Ton,
};

/** `0` が表す赤 5 の牌コード（字牌には無い） */
const AKA_OF_SUIT: Readonly<Record<Suit, HaiCode | undefined>> = {
  m: AkaHai.ManZu5,
  p: AkaHai.PinZu5,
  s: AkaHai.SouZu5,
  z: undefined,
};

/** 色の表記順（正規形の整列に使う） */
const SUIT_ORDER: readonly Suit[] = ["m", "p", "s", "z"];

/**
 * 数字とサフィックスを牌コードに変換する。
 *
 * - 数牌: `1`〜`9` は牌種ID、`0` は赤 5
 * - 字牌: `1`〜`7`。`0` `8` `9` は不正
 *
 * @param digit 数字 (0〜9)
 * @param suit サフィックス
 * @returns 牌コード。その色で無効な数字なら Err
 */
export function digitToHaiCode(
  digit: number,
  suit: Suit,
): Result<HaiCode, MpszParseError> {
  if (digit === 0) {
    const aka = AKA_OF_SUIT[suit];
    return aka === undefined
      ? err(new MpszParseError(`字牌に赤 5 はありません: 0${suit}`))
      : ok(aka);
  }
  const maxNumber = suit === "z" ? 7 : 9;
  const code = HAI_KIND_IDS[SUIT_BASE[suit] + digit - 1];
  if (digit > maxNumber || code === undefined) {
    return err(
      new MpszParseError(`その色に存在しない数字です: ${digit}${suit}`),
    );
  }
  return ok(code);
}

/** 牌コードを表記（色・数字）に分解したもの */
export interface HaiNotation {
  readonly suit: Suit;
  /** 表記上の数字。赤 5 は 0 */
  readonly digit: number;
  /**
   * 正規形の整列順（SPEC 7.1）での順位。
   * 数字 1〜9 を 2 倍した値とし、赤 5 は 5 の直後（11）に置く。
   */
  readonly rank: number;
}

/**
 * 牌コードを表記（色・数字・整列順位）に分解する。
 *
 * @param code 牌コード
 * @returns 表記の要素
 */
export function haiCodeToNotation(code: HaiCode): HaiNotation {
  const kind = haiCodeToKindId(code);
  const type = kindIdToHaiType(kind);
  const suit: Suit =
    type === "Manzu"
      ? "m"
      : type === "Pinzu"
        ? "p"
        : type === "Souzu"
          ? "s"
          : "z";
  const number = kind - SUIT_BASE[suit] + 1;
  return isAkaHai(code)
    ? { suit, digit: 0, rank: number * 2 + 1 }
    : { suit, digit: number, rank: number * 2 };
}

/**
 * 色の整列順位 (m → p → s → z) を返す。
 */
export function suitOrder(suit: Suit): number {
  return SUIT_ORDER.indexOf(suit);
}
