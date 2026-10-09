import { describe, expect, expectTypeOf, it } from "vitest";
import {
  DuplicatedHaiIdError,
  InvalidHaiQuantityError,
  ShoushaiError,
  TahaiError,
} from "../errors";
import type {
  CompletedMentsu,
  HaiCode,
  HaiKindId,
  Kantsu,
  Shuntsu,
  Tehai,
  Tehai14,
} from "../types";
import { AkaHai, HaiKind, MentsuType, Tacha } from "../types";
import {
  isTehai13,
  isTehai14,
  sortTehai,
  tehaiToHaiKindId,
  validateTehai,
  validateTehai13,
  validateTehai14,
} from "./tehai";

describe("Tehai Validation (手牌の検証)", () => {
  // 指定枚数の連番牌（HaiKindId）と副露リストからダミーの Tehai を組み立てるヘルパー。
  // 連番にすることで InvalidHaiQuantityError を避け、
  // 開始オフセット 18 (SouZu1) で dummyMentsu/dummyKantsu (ManZu) との重複を避ける。
  // ※ src/utils/test-helpers.ts の createTehai (Extended MPSZ 文字列から Tehai14 を作る) とは別物。
  const createSequentialTehai = (
    closedCount: number,
    furos: CompletedMentsu[] = [],
  ) => ({
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
      const tehai = createSequentialTehai(13);
      const res = validateTehai13(tehai);
      expect(res.isOk()).toBe(true);
      expect(isTehai13(tehai)).toBe(true);
    });

    it("純手牌10枚 + 面子1つで検証が通過すること", () => {
      const tehai = createSequentialTehai(10, [dummyMentsu]);
      const res = validateTehai13(tehai);
      expect(res.isOk()).toBe(true);
      expect(isTehai13(tehai)).toBe(true);
    });

    it("純手牌10枚 + 槓子1つで検証が通過すること", () => {
      const tehai = createSequentialTehai(10, [dummyKantsu]);
      const res = validateTehai13(tehai);
      expect(res.isOk()).toBe(true);
      expect(isTehai13(tehai)).toBe(true);
    });

    it("槓子を含まない13枚未満の場合に ShoushaiError がスローされること", () => {
      const tehai = createSequentialTehai(12);
      const res = validateTehai13(tehai);
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(ShoushaiError);
      expect(isTehai13(tehai)).toBe(false);
    });

    it("槓子を含まない13枚を超える場合に TahaiError がスローされること", () => {
      const tehai = createSequentialTehai(14);
      const res = validateTehai13(tehai);
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(TahaiError);
      expect(isTehai13(tehai)).toBe(false);
    });
  });

  describe("Tehai14 (14枚の手牌)", () => {
    it("14枚ちょうどの手牌で検証が通過すること", () => {
      const tehai = createSequentialTehai(14);
      const res = validateTehai14(tehai);
      expect(res.isOk()).toBe(true);
      expect(isTehai14(tehai)).toBe(true);
    });

    it("純手牌11枚 + 槓子1つで検証が通過すること", () => {
      const tehai = createSequentialTehai(11, [dummyKantsu]);
      const res = validateTehai14(tehai);
      expect(res.isOk()).toBe(true);
      expect(isTehai14(tehai)).toBe(true);
    });

    it("槓子を含まない14枚未満の場合に ShoushaiError がスローされること", () => {
      const tehai = createSequentialTehai(13);
      const res = validateTehai14(tehai);
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(ShoushaiError);
      expect(isTehai14(tehai)).toBe(false);
    });

    it("槓子を含まない14枚を超える場合に TahaiError がスローされること", () => {
      const tehai = createSequentialTehai(15);
      const res = validateTehai14(tehai);
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(TahaiError);
      expect(isTehai14(tehai)).toBe(false);
    });
  });
  describe("Tehai (13〜14枚の汎用検証)", () => {
    it("13枚の手牌で検証が通過すること（ツモ前）", () => {
      const res = validateTehai(createSequentialTehai(13));
      expect(res.isOk()).toBe(true);
    });

    it("14枚の手牌で検証が通過すること（ツモ後）", () => {
      const res = validateTehai(createSequentialTehai(14));
      expect(res.isOk()).toBe(true);
    });

    it("12枚では少牌となること", () => {
      const res = validateTehai(createSequentialTehai(12));
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(ShoushaiError);
    });

    it("15枚では多牌となること", () => {
      const res = validateTehai(createSequentialTehai(15));
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(TahaiError);
    });

    it("枚数が範囲内でも牌の整合性が崩れていれば失敗すること", () => {
      // 1m を 5 枚含む 13 枚（各牌種は最大4枚）
      const tehai = {
        closed: [
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.PinZu1,
          HaiKind.PinZu2,
          HaiKind.PinZu3,
          HaiKind.PinZu4,
          HaiKind.PinZu5,
          HaiKind.PinZu6,
          HaiKind.PinZu7,
          HaiKind.PinZu8,
        ],
        exposed: [],
      };
      const res = validateTehai(tehai);
      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(InvalidHaiQuantityError);
      }
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
      const res = validateTehai13(tehai1m5);
      expect(res.isErr()).toBe(true);
      if (res.isErr())
        expect(res.error).toBeInstanceOf(InvalidHaiQuantityError);
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
      const res = validateTehai14(tehai1m5_14);
      expect(res.isErr()).toBe(true);
      if (res.isErr())
        expect(res.error).toBeInstanceOf(InvalidHaiQuantityError);
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
      // @ts-expect-error Testing HaiId numbers directly
      const res = validateTehai13(tehaiDup);
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(DuplicatedHaiIdError);
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

      // @ts-expect-error Testing numbers
      const res = validateTehai13(tehaiLow);
      expect(res.isOk()).toBe(true);
    });
  });
});

describe("tehaiToHaiKindId (牌コードの手牌を牌種IDに変換)", () => {
  it("純手牌・面子・副露情報の赤 5 をすべて 5 の牌種IDに落とし、並び順を保つこと", () => {
    const tehai: Tehai<HaiCode> = {
      closed: [AkaHai.ManZu5, HaiKind.ManZu1, HaiKind.ManZu5],
      exposed: [
        {
          type: MentsuType.Shuntsu,
          hais: [HaiKind.PinZu4, AkaHai.PinZu5, HaiKind.PinZu6],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: AkaHai.PinZu5 },
        },
        {
          type: MentsuType.Kantsu,
          hais: [HaiKind.SouZu5, HaiKind.SouZu5, HaiKind.SouZu5, AkaHai.SouZu5],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: AkaHai.SouZu5,
            kakanHai: HaiKind.SouZu5,
          },
        },
        {
          type: MentsuType.Kantsu,
          hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5, AkaHai.ManZu5],
        },
      ],
    };

    expect(tehaiToHaiKindId(tehai)).toEqual({
      closed: [HaiKind.ManZu5, HaiKind.ManZu1, HaiKind.ManZu5],
      exposed: [
        {
          type: MentsuType.Shuntsu,
          hais: [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: HaiKind.PinZu5 },
        },
        {
          type: MentsuType.Kantsu,
          hais: [
            HaiKind.SouZu5,
            HaiKind.SouZu5,
            HaiKind.SouZu5,
            HaiKind.SouZu5,
          ],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: HaiKind.SouZu5,
            kakanHai: HaiKind.SouZu5,
          },
        },
        {
          type: MentsuType.Kantsu,
          hais: [
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
          ],
        },
      ],
    });
  });

  it("副露情報の無い面子には furo を付けないこと", () => {
    const converted = tehaiToHaiKindId({
      closed: [],
      exposed: [{ type: MentsuType.Kantsu, hais: [27, 27, 27, 27] }],
    });
    expect(converted.exposed[0]).not.toHaveProperty("furo");
  });
});

describe("sortTehai (純手牌の理牌)", () => {
  const pon: CompletedMentsu<HaiCode> = {
    type: MentsuType.Koutsu,
    hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
    furo: { type: "Pon", from: Tacha.Toimen, nakiHai: HaiKind.Chun },
  };
  const chi: CompletedMentsu<HaiCode> = {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
    furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: HaiKind.ManZu1 },
  };

  it("純手牌を萬子 → 筒子 → 索子 → 字牌の順に並べ、赤 5 は 5 の直後に置く", () => {
    const tehai: Tehai<HaiCode> = {
      closed: [
        HaiKind.Ton,
        AkaHai.PinZu5,
        HaiKind.SouZu1,
        HaiKind.PinZu5,
        HaiKind.ManZu9,
        HaiKind.PinZu6,
      ],
      exposed: [],
    };
    expect(sortTehai(tehai)).toEqual({
      closed: [
        HaiKind.ManZu9,
        HaiKind.PinZu5,
        AkaHai.PinZu5,
        HaiKind.PinZu6,
        HaiKind.SouZu1,
        HaiKind.Ton,
      ],
      exposed: [],
    });
  });

  it("晒した面子は順も中身も変えない", () => {
    const tehai: Tehai<HaiCode> = {
      closed: [HaiKind.SouZu9, HaiKind.SouZu8],
      exposed: [pon, chi],
    };
    const sorted = sortTehai(tehai);
    expect(sorted.exposed).toEqual([pon, chi]);
    expect(sorted.exposed[0]).toBe(pon);
    expect(sorted.exposed[1]).toBe(chi);
  });

  it("引数の手牌を変更せず、新しい手牌を返す", () => {
    const closed: HaiKindId[] = [HaiKind.SouZu9, HaiKind.ManZu1];
    const tehai: Tehai = { closed, exposed: [] };
    const sorted = sortTehai(tehai);
    expect(sorted).not.toBe(tehai);
    expect(tehai.closed).toEqual([HaiKind.SouZu9, HaiKind.ManZu1]);
    expect(sorted.closed).toEqual([HaiKind.ManZu1, HaiKind.SouZu9]);
  });

  it("Tehai14 を渡すと Tehai14 のまま返る（ブランドを保つ）", () => {
    const closed: HaiKindId[] = [
      HaiKind.Chun,
      HaiKind.Chun,
      HaiKind.SouZu3,
      HaiKind.SouZu2,
      HaiKind.SouZu1,
      HaiKind.PinZu6,
      HaiKind.PinZu5,
      HaiKind.PinZu4,
      HaiKind.ManZu9,
      HaiKind.ManZu8,
      HaiKind.ManZu7,
      HaiKind.ManZu3,
      HaiKind.ManZu2,
      HaiKind.ManZu1,
    ];
    const tehai14 = validateTehai14({ closed, exposed: [] });
    if (tehai14.isErr()) throw tehai14.error;
    const sorted = sortTehai(tehai14.value);
    expectTypeOf(sorted).toEqualTypeOf<Tehai14>();
    expect(isTehai14(sorted)).toBe(true);
    expect(sorted.closed).toEqual([...closed].reverse());
  });
});
