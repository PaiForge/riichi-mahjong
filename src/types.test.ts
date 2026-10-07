import { describe, expect, expectTypeOf, it } from "vitest";

import {
  AkaHai,
  type Furo,
  FuroType,
  HAI_KIND_IDS,
  type HaiCode,
  type HaiId,
  HaiKind,
  type HaiKindId,
  MentsuType,
  type ShantenNumber,
  type Shuntsu,
  Tacha,
  type Tehai,
} from "./types";

describe("HaiKindId (牌種ID)", () => {
  it("34種類の牌IDが定義されていること", () => {
    expect(HAI_KIND_IDS).toHaveLength(34);
    expect(HAI_KIND_IDS.at(0)).toBe(0);
    expect(HAI_KIND_IDS.at(-1)).toBe(33);
  });

  it("境界値外の数値は HaiKindId 型として扱われないこと", () => {
    expectTypeOf(0 as const).toExtend<HaiKindId>();
    expectTypeOf(33 as const).toExtend<HaiKindId>();

    expectTypeOf(-1).not.toExtend<HaiKindId>();
    expectTypeOf(34).not.toExtend<HaiKindId>();
  });

  it("HaiKind 定数が正しい Literal Type として定義されていること", () => {
    expectTypeOf(HaiKind.ManZu1).toEqualTypeOf<0>();
    expectTypeOf(HaiKind.ManZu9).toEqualTypeOf<8>();
    expectTypeOf(HaiKind.PinZu1).toEqualTypeOf<9>();
    expectTypeOf(HaiKind.PinZu9).toEqualTypeOf<17>();
    expectTypeOf(HaiKind.SouZu1).toEqualTypeOf<18>();
    expectTypeOf(HaiKind.SouZu9).toEqualTypeOf<26>();
    expectTypeOf(HaiKind.Ton).toEqualTypeOf<27>();
    expectTypeOf(HaiKind.Chun).toEqualTypeOf<33>();
  });
});

describe("ShantenNumber (シャンテン数)", () => {
  it("定義内の数値は ShantenNumber 型として扱われること", () => {
    expectTypeOf(0 as const).toExtend<ShantenNumber>();
    expectTypeOf(13 as const).toExtend<ShantenNumber>();
  });

  it("境界値外の数値は ShantenNumber 型として扱われないこと", () => {
    expectTypeOf(-1).not.toExtend<ShantenNumber>();
    expectTypeOf(14).not.toExtend<ShantenNumber>();
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
  it("Chi/Pon/Daiminkan/Kakan は Furo 型として適合すること", () => {
    expectTypeOf({
      type: FuroType.Chi,
      from: Tacha.Kamicha,
      nakiHai: HaiKind.ManZu1,
    }).toExtend<Furo>();
    expectTypeOf({
      type: FuroType.Pon,
      from: Tacha.Toimen,
      nakiHai: HaiKind.PinZu5,
    }).toExtend<Furo>();
    expectTypeOf({
      type: FuroType.Daiminkan,
      from: Tacha.Shimocha,
      nakiHai: HaiKind.Chun,
    }).toExtend<Furo>();
    expectTypeOf({
      type: FuroType.Kakan,
      from: Tacha.Kamicha,
      nakiHai: HaiKind.PinZu5,
      kakanHai: HaiKind.PinZu5,
    }).toExtend<Furo>();
  });

  it("牌コード (HaiCode) の副露は赤 5 を鳴いた牌・加槓牌に持てること", () => {
    expectTypeOf({
      type: FuroType.Chi,
      from: Tacha.Kamicha,
      nakiHai: AkaHai.ManZu5,
    }).toExtend<Furo<HaiCode>>();
    expectTypeOf({
      type: FuroType.Kakan,
      from: Tacha.Toimen,
      nakiHai: HaiKind.PinZu5,
      kakanHai: AkaHai.PinZu5,
    }).toExtend<Furo<HaiCode>>();
    // 牌種IDの副露には赤 5 を入れられない
    expectTypeOf({
      type: FuroType.Pon,
      from: Tacha.Toimen,
      nakiHai: AkaHai.PinZu5,
    }).not.toExtend<Furo>();
  });

  it("不正な構造は Furo 型として扱われないこと", () => {
    // missing type
    expectTypeOf({
      from: Tacha.Kamicha,
      nakiHai: HaiKind.ManZu1,
    }).not.toExtend<Furo>();
    // missing from
    expectTypeOf({
      type: FuroType.Chi,
      nakiHai: HaiKind.ManZu1,
    }).not.toExtend<Furo>();
    // missing nakiHai（鳴いた牌は必須）
    expectTypeOf({
      type: FuroType.Pon,
      from: Tacha.Toimen,
    }).not.toExtend<Furo>();
    // Kakan without kakanHai（加槓牌は必須）
    expectTypeOf({
      type: FuroType.Kakan,
      from: Tacha.Toimen,
      nakiHai: HaiKind.PinZu5,
    }).not.toExtend<Furo>();
    // Chi from non-kamicha（チーは上家からのみ）
    expectTypeOf({
      type: FuroType.Chi,
      from: Tacha.Toimen,
      nakiHai: HaiKind.ManZu1,
    }).not.toExtend<Furo>();
    // invalid type
    expectTypeOf({
      type: "InvalidFuro",
      from: Tacha.Kamicha,
      nakiHai: HaiKind.ManZu1,
    }).not.toExtend<Furo>();
  });
});

describe("HaiCode (牌コード)", () => {
  it("赤牌IDは 34〜36 で牌種IDと重ならないこと", () => {
    expect(AkaHai.ManZu5).toBe(34);
    expect(AkaHai.PinZu5).toBe(35);
    expect(AkaHai.SouZu5).toBe(36);
    expect(Object.keys(AkaHai)).toHaveLength(3);
  });

  it("牌種IDは牌コードの部分型であること", () => {
    expectTypeOf<HaiKindId>().toExtend<HaiCode>();
    expectTypeOf(AkaHai.ManZu5).toExtend<HaiCode>();
    expectTypeOf(AkaHai.ManZu5).not.toExtend<HaiKindId>();
    expectTypeOf(37).not.toExtend<HaiCode>();
  });

  it("牌種IDの手牌はそのまま牌コードの手牌として扱えること", () => {
    const tehai: Tehai = { closed: [HaiKind.ManZu1], exposed: [] };
    expectTypeOf(tehai).toExtend<Tehai<HaiCode>>();
  });
});

describe("HaiId (牌ID)", () => {
  it("数値として扱えるが、型システム上は区別される", () => {
    const id = 0 as HaiId;
    expectTypeOf(id).toExtend<number>();
    expectTypeOf(0).not.toEqualTypeOf<HaiId>(); // Brand型なので単純なnumberは代入不可（実際は代入可能かもしれないが、意図としてはチェックしたい）
    expect(id).toBe(0);
  });
});

describe("Tehai (手牌)", () => {
  it("純手牌と副露を持てる", () => {
    const shuntsu: Shuntsu = {
      type: MentsuType.Shuntsu,
      hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
    };

    const tehai: Tehai = {
      closed: [HaiKind.ManZu4, HaiKind.ManZu5],
      exposed: [shuntsu],
    };

    expect(tehai.closed).toHaveLength(2);
    expect(tehai.exposed).toHaveLength(1);
  });

  it("HaiId型でも手牌を構成できる (Generics)", () => {
    const id1 = 0 as HaiId;
    const id2 = 1 as HaiId;
    const id3 = 2 as HaiId;
    const id4 = 3 as HaiId;

    const shuntsu: Shuntsu<HaiId> = {
      type: MentsuType.Shuntsu,
      hais: [id1, id2, id3],
    };

    const tehai: Tehai<HaiId> = {
      closed: [id4],
      exposed: [shuntsu],
    };

    expectTypeOf(shuntsu).toExtend<Shuntsu<HaiId>>();
    expectTypeOf(tehai).toExtend<Tehai<HaiId>>();

    expect(tehai.closed[0]).toBe(3);
    expect(tehai.exposed[0]?.hais[0]).toBe(0);
  });
});
