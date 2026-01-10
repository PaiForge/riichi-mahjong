import { describe, expect, it } from "vitest";
import {
  DuplicatedHaiIdError,
  InvalidHaiQuantityError,
  ShoushaiError,
  TahaiError,
} from "../errors";
import type { CompletedMentsu, HaiKindId, Kantsu, Shuntsu } from "../types";
import { HaiKind, MentsuType } from "../types";
import {
  isTehai13,
  isTehai14,
  validateTehai13,
  validateTehai14,
} from "./tehai";

describe("Tehai Validation (手牌の検証)", () => {
  // Helper to create a dummy Tehai with N closed tiles
  // Helper to create a dummy Tehai with N closed tiles
  // using sequential tiles to avoid "InvalidHaiQuantityError"
  // Start from offset 18 (SouZu1) to avoid overlap with dummyMentsu/dummyKantsu (ManZu)
  const createTehai = (closedCount: number, furos: CompletedMentsu[] = []) => ({
    closed: Array.from(
      { length: closedCount },
      (_, i) => ((i + 18) % 34) as HaiKindId,
    ),
    exposed: furos,
  });

  const dummyMentsu: Shuntsu = {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
  };

  const dummyKantsu: Kantsu = {
    type: MentsuType.Kantsu,
    hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1],
  };

  describe("Tehai13 (13枚の手牌)", () => {
    it("13枚ちょうどの手牌で検証が通過すること", () => {
      const tehai = createTehai(13);
      expect(() => {
        validateTehai13(tehai);
      }).not.toThrow();
      expect(isTehai13(tehai)).toBe(true);
    });

    it("純手牌10枚 + 面子1つで検証が通過すること", () => {
      const tehai = createTehai(10, [dummyMentsu]);
      expect(() => {
        validateTehai13(tehai);
      }).not.toThrow();
      expect(isTehai13(tehai)).toBe(true);
    });

    it("純手牌10枚 + 槓子1つで検証が通過すること", () => {
      const tehai = createTehai(10, [dummyKantsu]);
      expect(() => {
        validateTehai13(tehai);
      }).not.toThrow();
      expect(isTehai13(tehai)).toBe(true);
    });

    it("槓子を含まない13枚未満の場合に ShoushaiError がスローされること", () => {
      const tehai = createTehai(12);
      expect(() => {
        validateTehai13(tehai);
      }).toThrow(ShoushaiError);
      expect(isTehai13(tehai)).toBe(false);
    });

    it("槓子を含まない13枚を超える場合に TahaiError がスローされること", () => {
      const tehai = createTehai(14);
      expect(() => {
        validateTehai13(tehai);
      }).toThrow(TahaiError);
      expect(isTehai13(tehai)).toBe(false);
    });
  });

  describe("Tehai14 (14枚の手牌)", () => {
    it("14枚ちょうどの手牌で検証が通過すること", () => {
      const tehai = createTehai(14);
      expect(() => {
        validateTehai14(tehai);
      }).not.toThrow();
      expect(isTehai14(tehai)).toBe(true);
    });

    it("純手牌11枚 + 槓子1つで検証が通過すること", () => {
      const tehai = createTehai(11, [dummyKantsu]);
      expect(() => {
        validateTehai14(tehai);
      }).not.toThrow();
      expect(isTehai14(tehai)).toBe(true);
    });

    it("槓子を含まない14枚未満の場合に ShoushaiError がスローされること", () => {
      const tehai = createTehai(13);
      expect(() => {
        validateTehai14(tehai);
      }).toThrow(ShoushaiError);
      expect(isTehai14(tehai)).toBe(false);
    });

    it("槓子を含まない14枚を超える場合に TahaiError がスローされること", () => {
      const tehai = createTehai(15);
      expect(() => {
        validateTehai14(tehai);
      }).toThrow(TahaiError);
      expect(isTehai14(tehai)).toBe(false);
    });
  });
  describe("Consistency (整合性チェック)", () => {
    it("同一の牌種が5枚以上ある場合に InvalidHaiQuantityError がスローされること", () => {
      // 1m が5枚
      const tehai1m5 = {
        closed: [
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu2,
          HaiKind.ManZu3,
          HaiKind.ManZu4,
          HaiKind.ManZu5,
          HaiKind.ManZu6,
          HaiKind.ManZu7,
          HaiKind.ManZu8,
          HaiKind.ManZu9,
        ],
        exposed: [],
      };
      expect(() => {
        validateTehai13(tehai1m5);
      }).toThrow(InvalidHaiQuantityError);
    });

    it("Tehai14でも同一の牌種が5枚以上ある場合に InvalidHaiQuantityError がスローされること", () => {
      const tehai1m5_14 = {
        closed: [
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu2,
          HaiKind.ManZu3,
          HaiKind.ManZu4,
          HaiKind.ManZu5,
          HaiKind.ManZu6,
          HaiKind.ManZu7,
          HaiKind.ManZu8,
          HaiKind.ManZu9,
          HaiKind.PinZu1, // 14th tile
        ],
        exposed: [],
      };
      expect(() => {
        validateTehai14(tehai1m5_14);
      }).toThrow(InvalidHaiQuantityError);
    });

    it("HaiId指定で重複IDがある場合に DuplicatedHaiIdError がスローされること", () => {
      // 物理牌ID 0 (1m) が2枚
      // 全体が13枚になるようにする
      const tehaiDup = {
        closed: [
          0, // 1m
          0, // 1m (duplicated)
          100, // SouZu high ID (activates HaiId mode)
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
        ],
        exposed: [],
      };
      expect(() => {
        // @ts-expect-error Testing HaiId numbers directly
        validateTehai13(tehaiDup);
      }).toThrow(DuplicatedHaiIdError);
    });

    it("HaiKindIdモードでは重複IDエラーは出ず、枚数チェックのみ行われること", () => {
      // 全て33以下のIDだが、意図的に数値として渡す
      // しかし、33以下のみだとHaiKindIdとみなされるため、重複IDチェックはスキップされる
      // (KindIdとして正当ならOK)
      const tehaiLow = {
        closed: [
          0,
          0, // 1m x2 (OK)
          0,
          0, // 1m x2 (Total 4, OK)
          1,
          1,
          1,
          1,
          2,
          2,
          2,
          2,
          3,
        ],
        exposed: [],
      };

      expect(() => {
        // @ts-expect-error Testing numbers
        validateTehai13(tehaiLow);
      }).not.toThrow();
    });
  });
});
