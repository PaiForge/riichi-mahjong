import { describe, expect, it } from "vitest";
import { HAI_KIND_IDS, HaiKind } from "./types.js";

describe("HaiKindId (牌種ID)", () => {
  it("34種類の牌IDが定義されていること", () => {
    expect(HAI_KIND_IDS).toHaveLength(34);
  });

  it("HaiKind 定数が正しいIDにマッピングされていること", () => {
    expect(HaiKind.ManZu1).toBe(0);
    expect(HaiKind.ManZu9).toBe(8);
    expect(HaiKind.PinZu1).toBe(9);
    expect(HaiKind.PinZu9).toBe(17);
    expect(HaiKind.SouZu1).toBe(18);
    expect(HaiKind.SouZu9).toBe(26);
    expect(HaiKind.Ton).toBe(27);
    expect(HaiKind.Chun).toBe(33);
  });
});
