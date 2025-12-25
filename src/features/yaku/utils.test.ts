import { describe, it, expect } from "vitest";
import { isMenzen } from "./utils";
import { createTehai } from "../../utils/test-helpers";

describe("isMenzen", () => {
  it("副露がない手牌は門前である", () => {
    // 123m 456p 789s 11z 222m
    const hand = createTehai("123m456p789s11z222m");
    expect(isMenzen(hand)).toBe(true);
  });

  it("暗槓のみを含む手牌は門前である", () => {
    // 123m 456p 789s 11z (2222m) <- 暗槓
    const hand = createTehai("123m456p789s11z(2222m)");
    expect(isMenzen(hand)).toBe(true);
  });

  it("明順（チー）を含む手牌は門前ではない", () => {
    // 123m 456p 11z [789s]
    const hand = createTehai("123m456p11z[789s]");
    expect(isMenzen(hand)).toBe(false);
  });

  it("明刻（ポン）を含む手牌は門前ではない", () => {
    // 123m 456p 11z [222m]
    const hand = createTehai("123m456p11z[222m]");
    expect(isMenzen(hand)).toBe(false);
  });

  it("大明槓（ミンカン）を含む手牌は門前ではない", () => {
    // 123m 456p 11z [2222m]
    const hand = createTehai("123m456p11z[2222m]");
    expect(isMenzen(hand)).toBe(false);
  });

  it("暗槓と明副露が混在する場合は門前ではない", () => {
    // [123m] (4444p) ...
    const hand = createTehai("[123m](4444p)789s11z");
    expect(isMenzen(hand)).toBe(false);
  });
});
