import { describe, it, expect } from "vitest";
import { getHouraStructuresForKokushi } from "./kokushi";
import { createTehai } from "../../../../utils/test-helpers";

describe("getHouraStructuresForKokushi", () => {
  it("国士無双形を構造化できること", () => {
    // 19m 19p 19s 1234567z 1m (1m jantou)
    const hand = createTehai("19m19p19s1234567z1m");
    const results = getHouraStructuresForKokushi(hand);
    expect(results.length).toBe(1);
    expect(results[0]?.type).toBe("Kokushi");
    expect(results[0]?.yaochu).toHaveLength(13);
    expect(results[0]?.jantou).toBeDefined();
  });

  it("通常の面子手は国士無双として構造化できないこと", () => {
    const hand = createTehai("123m456p789s111z22z");
    const results = getHouraStructuresForKokushi(hand);
    expect(results).toHaveLength(0);
  });

  it("鳴きがある場合は国士無双として構造化できないこと", () => {
    // 国士に近いが鳴いているケース
    const hand = createTehai("19m19p19s1234567z[111z]");
    const results = getHouraStructuresForKokushi(hand);
    expect(results).toHaveLength(0);
  });
});
