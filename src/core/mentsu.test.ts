import { describe, expect, it } from "vitest";
import {
  HaiKind,
  type HaiKindId,
  type Kantsu,
  type Koutsu,
  MentsuType,
  type Shuntsu,
  type Toitsu,
} from "../types.js";
import {
  isValidKantsu,
  isValidKoutsu,
  isValidShuntsu,
  isValidToitsu,
} from "./mentsu.js";

describe("isValidShuntsu", () => {
  it("有効な順子はバリデーションを通る", () => {
    const shuntsu: Shuntsu = {
      type: MentsuType.Shuntsu,
      hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
    };
    expect(isValidShuntsu(shuntsu.hais)).toBe(true);
  });

  it("種類が不一致の順子は無効", () => {
    const hais = [
      HaiKind.ManZu1,
      HaiKind.PinZu2,
      HaiKind.ManZu3,
    ] as unknown as [HaiKindId, HaiKindId, HaiKindId];
    expect(isValidShuntsu(hais)).toBe(false);
  });

  it("数字が連続していない順子は無効", () => {
    const hais = [HaiKind.ManZu1, HaiKind.ManZu3, HaiKind.ManZu4] as [
      HaiKindId,
      HaiKindId,
      HaiKindId,
    ];
    expect(isValidShuntsu(hais)).toBe(false);
  });

  it("字牌を含む順子は無効", () => {
    const hais = [HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun] as [
      HaiKindId,
      HaiKindId,
      HaiKindId,
    ];
    expect(isValidShuntsu(hais)).toBe(false);
  });
});

describe("isValidKoutsu", () => {
  it("有効な刻子はバリデーションを通る", () => {
    const koutsu: Koutsu = {
      type: MentsuType.Koutsu,
      hais: [HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1],
    };
    expect(isValidKoutsu(koutsu.hais)).toBe(true);
  });

  it("異なる牌を含む刻子は無効", () => {
    const hais = [HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu2] as [
      HaiKindId,
      HaiKindId,
      HaiKindId,
    ];
    expect(isValidKoutsu(hais)).toBe(false);
  });

  it("数字が同じでも種類が異なる場合は無効 (例: 1m, 1p, 1s)", () => {
    const hais = [HaiKind.ManZu1, HaiKind.PinZu1, HaiKind.SouZu1] as [
      HaiKindId,
      HaiKindId,
      HaiKindId,
    ];
    expect(isValidKoutsu(hais)).toBe(false);
  });
});

describe("isValidKantsu", () => {
  it("有効な槓子はバリデーションを通る", () => {
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: [HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1],
    };
    expect(isValidKantsu(kantsu.hais)).toBe(true);
  });

  it("異なる牌混合の槓子は無効", () => {
    const hais = [
      HaiKind.PinZu1,
      HaiKind.PinZu1,
      HaiKind.PinZu1,
      HaiKind.PinZu2,
    ] as [HaiKindId, HaiKindId, HaiKindId, HaiKindId];
    expect(isValidKantsu(hais)).toBe(false);
  });
});

describe("isValidToitsu", () => {
  it("有効な対子はバリデーションを通る", () => {
    const toitsu: Toitsu = {
      type: MentsuType.Toitsu,
      hais: [HaiKind.SouZu5, HaiKind.SouZu5],
    };
    expect(isValidToitsu(toitsu.hais)).toBe(true);
  });

  it("異なる牌の対子は無効", () => {
    const hais = [HaiKind.ManZu1, HaiKind.ManZu2] as [HaiKindId, HaiKindId];
    expect(isValidToitsu(hais)).toBe(false);
  });
});
