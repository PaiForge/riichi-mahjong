import { describe, it, expect } from "vitest";
import { parseExtendedMspz, isExtendedMspz, isMspz, asMspz } from "./mspz";
import { HaiKind } from "../../types";
import { MspzParseError } from "../../errors";

describe("Standard MSPZ", () => {
  describe("isMspz", () => {
    it("returns true for regular MSPZ strings", () => {
      expect(isMspz("123m456p")).toBe(true);
      expect(isMspz("")).toBe(true);
    });

    it("returns false for Extended MSPZ strings", () => {
      expect(isMspz("[123m]")).toBe(false);
      expect(isMspz("(11z)")).toBe(false);
    });

    it("returns false for invalid strings", () => {
      expect(isMspz("abc")).toBe(false);
      expect(isMspz("123")).toBe(false);
      expect(isMspz("123m456")).toBe(false);
      expect(isMspz("m")).toBe(false);
    });
  });

  describe("asMspz", () => {
    it("returns ok for valid MSPZ strings", () => {
      const res = asMspz("123m");
      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value).toBe("123m");
      }
    });

    it("returns err for Extended MSPZ strings", () => {
      const res = asMspz("[123m]");
      expect(res.isErr()).toBe(true);
    });
  });
});

describe("Extended MSPZ", () => {
  describe("isExtendedMspz", () => {
    it("returns true for strings containing '[' or '(' and valid format", () => {
      expect(isExtendedMspz("[123m]")).toBe(true);
      expect(isExtendedMspz("(11z)")).toBe(true);
      expect(isExtendedMspz("123m[456p]")).toBe(true);
    });

    it("returns false for regular MSPZ strings", () => {
      expect(isExtendedMspz("123m456p")).toBe(false);
      expect(isExtendedMspz("")).toBe(false);
    });

    it("returns false for invalid extended strings", () => {
      expect(isExtendedMspz("[123]")).toBe(false); // missing suffix inside
      expect(isExtendedMspz("123[m]")).toBe(false); // missing digits inside? match \d+[mpsz]. "m" is not \d+m. Wait, \d+ is at least one digit.
      expect(isExtendedMspz("[abc]")).toBe(false);
      expect(isExtendedMspz("123m[456p")).toBe(false); // unbalanced
      expect(isExtendedMspz("123m]456p[")).toBe(false); // invalid structure
    });
  });

  describe("parseExtendedMspz", () => {
    it("parses regular MSPZ as closed tiles", () => {
      const res = parseExtendedMspz("123m");
      if (res.isErr()) throw res.error;
      const result = res.value;
      expect(result.closed).toHaveLength(3);
      expect(result.exposed).toHaveLength(0);
      expect(result.closed[0]).toBe(HaiKind.ManZu1);
    });

    it("parses Shuntsu (Chi) in brackets", () => {
      const res = parseExtendedMspz("[123m]");
      if (res.isErr()) throw res.error;
      const result = res.value;
      expect(result.closed).toHaveLength(0);
      expect(result.exposed).toHaveLength(1);

      const mentsu = result.exposed[0];
      expect(mentsu).toBeDefined();
      if (!mentsu) throw new Error("Should be defined");

      expect(mentsu.type).toBe("Shuntsu");
      expect(mentsu.hais).toHaveLength(3);
      if (mentsu.type === "Shuntsu") {
        expect(mentsu.furo).toBeDefined();
        expect(mentsu.furo?.type).toBe("Chi");
      }
    });

    it("非連続な3枚はチーとして受理しないこと", () => {
      const res = parseExtendedMspz("[135m]");

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(MspzParseError);
      }
    });

    it("色をまたぐ3枚はチーとして受理しないこと", () => {
      const res = parseExtendedMspz("[12m3p]");

      expect(res.isErr()).toBe(true);
    });

    it("字牌の3枚はチーとして受理しないこと", () => {
      // 東南西は数牌のような連続性を持たない
      const res = parseExtendedMspz("[123z]");

      expect(res.isErr()).toBe(true);
    });

    it("9と1をまたぐ3枚はチーとして受理しないこと", () => {
      const res = parseExtendedMspz("[891m]");

      expect(res.isErr()).toBe(true);
    });

    it("昇順でない並びのチーは昇順に正規化されること", () => {
      // 表記上の並び順に意味はないため、順子はソート済みで返す
      const res = parseExtendedMspz("[321m]");
      if (res.isErr()) throw res.error;

      const mentsu = res.value.exposed[0];
      if (!mentsu) throw new Error("Should be defined");
      expect(mentsu.type).toBe("Shuntsu");
      expect(mentsu.hais).toEqual([
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
      ]);
    });

    it("parses Koutsu (Pon) in brackets", () => {
      const res = parseExtendedMspz("[111p]");
      if (res.isErr()) throw res.error;
      const result = res.value;
      expect(result.exposed).toHaveLength(1);

      const mentsu = result.exposed[0];
      expect(mentsu).toBeDefined();
      if (!mentsu) throw new Error("Should be defined");

      expect(mentsu.type).toBe("Koutsu");
      if (mentsu.type === "Koutsu") {
        expect(mentsu.furo?.type).toBe("Pon");
      }
    });

    it("parses Daiminkan (Open Quad) in brackets", () => {
      const res = parseExtendedMspz("[2222s]");
      if (res.isErr()) throw res.error;
      const result = res.value;
      expect(result.exposed).toHaveLength(1);

      const mentsu = result.exposed[0];
      expect(mentsu).toBeDefined();
      if (!mentsu) throw new Error("Should be defined");

      expect(mentsu.type).toBe("Kantsu");
      if (mentsu.type === "Kantsu") {
        expect(mentsu.furo?.type).toBe("Daiminkan");
      }
    });

    it("parses Ankan (Closed Quad) in parentheses", () => {
      const res = parseExtendedMspz("(1111z)");
      if (res.isErr()) throw res.error;
      const result = res.value;
      expect(result.exposed).toHaveLength(1);

      const kantsu = result.exposed[0];
      expect(kantsu).toBeDefined();
      if (!kantsu) throw new Error("Should be defined");

      expect(kantsu.type).toBe("Kantsu");
      // Ankan should ideally NOT have furo property, or explicit Ankan type depending on implementation.
      // Current type definition says furo is optional.
      if (kantsu.type === "Kantsu") {
        expect(kantsu.furo).toBeUndefined();
      }
    });

    it("parses mixed content correctly", () => {
      // 123m (chi), 456p (pon), 789s (closed)
      const res = parseExtendedMspz("789s[123m][444p]");
      if (res.isErr()) throw res.error;
      const result = res.value;
      expect(result.closed).toHaveLength(3); // 7,8,9s
      expect(result.exposed).toHaveLength(2); // chi, pon

      const chi = result.exposed.find((m) => m.type === "Shuntsu");
      const pon = result.exposed.find((m) => m.type === "Koutsu");

      expect(chi).toBeDefined();
      expect(pon).toBeDefined();
    });
  });
});
