import { describe, it, expect } from "vitest";
import { classifyMachi } from "./machi";
import {
  createShuntsu,
  createToitsu,
  createKoutsu,
  createMockHand,
  getHaiKindId,
} from "../utils/test-helpers";

describe("classifyMachi", () => {
  it("雀頭での和了（単騎待ち）を判定できること", () => {
    const jantou = createToitsu("55m");
    const hand = createMockHand(createShuntsu("123s"), jantou);
    expect(classifyMachi(hand, getHaiKindId("5m"))).toBe("Tanki");
  });

  it("双碰待ち（シャボ）を判定できること", () => {
    // 11 22 -> Agari 1 -> 111 22.
    // Hand structure has Koutsu 111.
    const koutsu = createKoutsu("111m");
    const hand = createMockHand(koutsu, createToitsu("22m"));
    expect(classifyMachi(hand, getHaiKindId("1m"))).toBe("Shanpon");
  });

  it("両面待ちを判定できること", () => {
    // 234m, agari=2m -> Ryanmen (completion of 2,5 wait)
    // Hand has 234m. Wait was 34m. Agari 2m or 5m.
    // If Agari 2m -> Completed 234m.
    const shuntsu1 = createShuntsu("234m");
    const hand1 = createMockHand(shuntsu1, createToitsu("99p"));
    expect(classifyMachi(hand1, getHaiKindId("2m"))).toBe("Ryanmen");

    // If Agari 5m -> Completed 345m.
    const shuntsu2 = createShuntsu("345m");
    const hand2 = createMockHand(shuntsu2, createToitsu("99p"));
    expect(classifyMachi(hand2, getHaiKindId("5m"))).toBe("Ryanmen");
  });

  it("辺張待ち（ペンチャン）を判定できること", () => {
    const shuntsu = createShuntsu("123m");
    const hand = createMockHand(shuntsu, createToitsu("99p"));
    expect(classifyMachi(hand, getHaiKindId("3m"))).toBe("Penchan");
  });

  it("嵌張待ち（カンチャン）を判定できること", () => {
    const shuntsu = createShuntsu("234m");
    const hand = createMockHand(shuntsu, createToitsu("99p"));
    expect(classifyMachi(hand, getHaiKindId("3m"))).toBe("Kanchan");
  });

  it("和了牌が手牌構造に含まれない場合は undefined を返すこと", () => {
    const hand = createMockHand(createShuntsu("234m"), createToitsu("99p"));
    expect(classifyMachi(hand, getHaiKindId("1z"))).toBe(undefined);
  });
});
