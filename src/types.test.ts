import { describe, expect, it } from "vitest";
import {
  type Furo,
  FuroType,
  HAI_KIND_IDS,
  type HaiId,
  HaiKind,
  type Kantsu,
  Koutsu,
  Mentsu,
  MentsuType,
  type Shuntsu,
  Tacha,
  type Toitsu,
} from "./types.js";

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

  describe("ShantenNumber (シャンテン数)", () => {
    it("型としてインポート可能であること", () => {
      // 型レベルのチェックのため、ランタイムでのアサーションは行わないが、
      // コンパイルエラーにならないことを確認する意図。
      const tenpai: import("./types").ShantenNumber = 0;
      const maxShanten: import("./types").ShantenNumber = 13;
      expect(tenpai).toBe(0);
      expect(maxShanten).toBe(13);
    });
  });

  describe("Tacha (他家)", () => {
    it("定義値が正しいこと", () => {
      expect(Tacha.Shimocha).toBe(1);
      expect(Tacha.Toimen).toBe(2);
      expect(Tacha.Kamicha).toBe(3);
    });

    it("要素数が3つであること", () => {
      expect(Object.keys(Tacha)).toHaveLength(3);
    });
  });

  describe("Furo (副露メタ情報)", () => {
    it("Chi/Pon/Daiminkan/Kakan は from プロパティを持つこと", () => {
      // 型チェックを通るオブジェクトを生成できるか確認
      const chi: Furo = { type: FuroType.Chi, from: Tacha.Kamicha };
      const pon: Furo = { type: FuroType.Pon, from: Tacha.Toimen };
      const daiminkan: Furo = {
        type: FuroType.Daiminkan,
        from: Tacha.Shimocha,
      };
      const kakan: Furo = { type: FuroType.Kakan, from: Tacha.Kamicha };

      expect(chi.from).toBe(3);
      expect(pon.from).toBe(2);
      expect(daiminkan.from).toBe(1);
      expect(kakan.from).toBe(3);
    });
  });

  describe("HaiId (牌ID)", () => {
    it("数値として扱えるが、型システム上は区別される", () => {
      // ランタイムではただの数値
      const id = 0 as HaiId;
      expect(id).toBe(0);
    });
  });

  describe("Mentsu (面子)", () => {
    it("Shuntsu (順子) は3枚の牌を持つ", () => {
      // デフォルトは HaiKindId
      const shuntsu: Shuntsu = {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
      };
      expect(shuntsu.hais).toHaveLength(3);
    });

    it("Kantsu (槓子) は4枚の牌を持つ", () => {
      const kantsu: Kantsu = {
        type: MentsuType.Kantsu,
        hais: [HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1],
      };
      expect(kantsu.hais).toHaveLength(4);
    });

    it("Toitsu (対子) は2枚の牌を持つ", () => {
      const toitsu: Toitsu = {
        type: MentsuType.Toitsu,
        hais: [HaiKind.SouZu5, HaiKind.SouZu5],
      };
      expect(toitsu.hais).toHaveLength(2);
    });

    it("HaiId型でも面子を構成できる (Generics)", () => {
      const id1 = 0 as HaiId;
      const id2 = 1 as HaiId;
      const id3 = 2 as HaiId;

      const shuntsu: Shuntsu<HaiId> = {
        type: MentsuType.Shuntsu,
        hais: [id1, id2, id3],
      };
      expect(shuntsu.hais).toHaveLength(3);
      expect(shuntsu.hais[0]).toBe(0);
    });
  });
});
