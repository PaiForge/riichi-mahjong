import { describe, it, expect } from "vitest";
import { classifyMachi } from "./machi";
import {
  createShuntsu,
  createToitsu,
  createKoutsu,
  createMockHand,
  createChiitoitsuStructureFromMpsz,
  createMentsuStructureFromMpsz,
} from "../utils/test-helpers";

describe("classifyMachi", () => {
  it("雀頭での和了（単騎待ち）を判定できること", () => {
    const hand = createMockHand(createShuntsu("123s"), createToitsu("55m"), {
      hai: "5m",
      in: "Jantou",
    });
    expect(classifyMachi(hand)).toBe("Tanki");
  });

  it("双碰待ち（シャボ）を判定できること", () => {
    // 11 22 -> Agari 1 -> 111 22.
    const hand = createMockHand(createKoutsu("111m"), createToitsu("22m"), {
      hai: "1m",
      in: "111m",
    });
    expect(classifyMachi(hand)).toBe("Shanpon");
  });

  it("両面待ちを判定できること", () => {
    // 34m -> 2m/5m
    const hand1 = createMockHand(createShuntsu("234m"), createToitsu("99p"), {
      hai: "2m",
      in: "234m",
    });
    expect(classifyMachi(hand1)).toBe("Ryanmen");

    const hand2 = createMockHand(createShuntsu("345m"), createToitsu("99p"), {
      hai: "5m",
      in: "345m",
    });
    expect(classifyMachi(hand2)).toBe("Ryanmen");
  });

  it("辺張待ち（ペンチャン）を判定できること", () => {
    const hand = createMockHand(createShuntsu("123m"), createToitsu("99p"), {
      hai: "3m",
      in: "123m",
    });
    expect(classifyMachi(hand)).toBe("Penchan");

    const hand789 = createMockHand(createShuntsu("789m"), createToitsu("99p"), {
      hai: "7m",
      in: "789m",
    });
    expect(classifyMachi(hand789)).toBe("Penchan");
  });

  it("嵌張待ち（カンチャン）を判定できること", () => {
    const hand = createMockHand(createShuntsu("234m"), createToitsu("99p"), {
      hai: "3m",
      in: "234m",
    });
    expect(classifyMachi(hand)).toBe("Kanchan");
  });

  it("同じ和了牌でも置き場所が違えば待ちの形が変わること", () => {
    // 345m 345m 55m 123s 456s の 5m: 雀頭なら単騎、順子なら両面
    const tanki = createMentsuStructureFromMpsz("33445555m123456s", {
      hai: "5m",
      in: "Jantou",
    });
    const ryanmen = createMentsuStructureFromMpsz("33445555m123456s", {
      hai: "5m",
      in: "345m",
    });

    expect(classifyMachi(tanki)).toBe("Tanki");
    expect(classifyMachi(ryanmen)).toBe("Ryanmen");
  });

  it("面子手でない場合は undefined を返すこと", () => {
    const hand = createChiitoitsuStructureFromMpsz("11223344556677m");
    expect(classifyMachi(hand)).toBe(undefined);
  });
});
