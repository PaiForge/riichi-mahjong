import { describe, it, expect } from "vitest";
import { parseExtendedMspz, isExtendedMspz, isMspz, asMspz } from "./mspz";
import { HaiKind } from "../../types";

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
    it("returns input for valid MSPZ strings", () => {
      expect(asMspz("123m")).toBe("123m");
    });

    it("throws error for Extended MSPZ strings", () => {
      expect(() => asMspz("[123m]")).toThrow("Invalid MSPZ string");
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
      const result = parseExtendedMspz("123m");
      expect(result.closed).toHaveLength(3);
      expect(result.exposed).toHaveLength(0);
      expect(result.closed[0]).toBe(HaiKind.ManZu1);
    });

    it("parses Shuntsu (Chi) in brackets", () => {
      const result = parseExtendedMspz("[123m]");
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

    it("parses Koutsu (Pon) in brackets", () => {
      const result = parseExtendedMspz("[111p]");
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
      const result = parseExtendedMspz("[2222s]");
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
      const result = parseExtendedMspz("(1111z)");
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
      const result = parseExtendedMspz("789s[123m][444p]");
      expect(result.closed).toHaveLength(3); // 7,8,9s
      expect(result.exposed).toHaveLength(2); // chi, pon

      const chi = result.exposed.find((m) => m.type === "Shuntsu");
      const pon = result.exposed.find((m) => m.type === "Koutsu");

      expect(chi).toBeDefined();
      expect(pon).toBeDefined();
    });
  });
});
