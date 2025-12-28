import { describe, it, expect } from "vitest";
import { getHouraStructuresForChiitoitsu } from "./chiitoitsu";
import { createTehai } from "../../../../utils/test-helpers";

describe("getHouraStructuresForChiitoitsu", () => {
  it("七対子形を構造化できること", () => {
    // 11 22 33 44 55 66 77
    const hand = createTehai("11m22m33m44p55p66s77s");
    const results = getHouraStructuresForChiitoitsu(hand);
    expect(results.length).toBe(1);
    expect(results[0]?.type).toBe("Chiitoitsu");
    expect(results[0]?.pairs).toHaveLength(7);
  });

  it("4面子1雀頭形は七対子として構造化できないこと", () => {
    // 111 234 567 888 99
    const hand = createTehai("111m234m567p888s99s");
    const results = getHouraStructuresForChiitoitsu(hand);
    expect(results).toHaveLength(0);
  });

  it("鳴きがある場合は七対子として構造化できないこと", () => {
    // 11 22 33 44 55 66 [77s] (Pon) - そもそも枚数合わないが、Exposedがあれば即座に弾くべき
    const hand = createTehai("11m22m33m44p55p66s[777s]");
    const results = getHouraStructuresForChiitoitsu(hand);
    expect(results).toHaveLength(0);
  });
});
