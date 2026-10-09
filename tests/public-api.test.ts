import { describe, expect, it } from "vitest";
import type { Result } from "neverthrow";
import * as PublicApi from "../src/index";
import type {
  HaiCode,
  HaiId,
  HaiKindId,
  HouraStructure,
  Kazehai,
  MachiType,
  Tehai,
  Tehai13,
  Tehai14,
} from "../src/index";
import { unwrapOrThrow } from "../src/utils/test-helpers";

describe("公開APIのエクスポート", () => {
  describe("calculateShanten", () => {
    // ランタイムチェック
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.calculateShanten).toBeDefined();
      expect(typeof PublicApi.calculateShanten).toBe("function");
    });

    // 'satisfies' を使用したコンパイル時の型チェック
    it("期待される型シグネチャを満たすこと", () => {
      // コンパイルエラーにならなければOK
      PublicApi.calculateShanten satisfies (
        tehai: Tehai13,
        useChiitoitsu?: boolean,
        useKokushi?: boolean,
      ) => Result<number, PublicApi.TehaiError>;

      expect(true).toBe(true);
    });
  });

  describe("getUkeire", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.getUkeire).toBeDefined();
      expect(typeof PublicApi.getUkeire).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.getUkeire satisfies (tehai: Tehai13) => HaiKindId[];

      expect(true).toBe(true);
    });
  });

  describe("detectYaku", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.detectYaku).toBeDefined();
      expect(typeof PublicApi.detectYaku).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.detectYaku satisfies (
        tehai: PublicApi.Tehai14,
        config: PublicApi.DetectYakuConfig,
      ) => PublicApi.YakuResult;

      // 役牌は三元牌に加えて場風・自風を含む
      "Bakaze" satisfies PublicApi.YakuName;
      "Jikaze" satisfies PublicApi.YakuName;

      expect(true).toBe(true);
    });
  });

  describe("rankScoresForTehai", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.rankScoresForTehai).toBeDefined();
      expect(typeof PublicApi.rankScoresForTehai).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.rankScoresForTehai satisfies (
        tehai: PublicApi.Tehai14,
        config: PublicApi.ScoreCalculationConfig,
      ) => readonly PublicApi.RankedScoreResult[];

      // 一覧の要素は構造解釈の詳細を必ず持つ
      const detailOf = (
        r: PublicApi.RankedScoreResult,
      ): PublicApi.ScoreDetail => r.detail;
      expect(typeof detailOf).toBe("function");
    });

    it("成立する和了が無ければ空配列を返すこと", () => {
      // 234m 234p 456s 678s 55z は役なし
      const tehai = PublicApi.tehaiToHaiKindId(
        unwrapOrThrow(PublicApi.parseMpsz("234m234p456s678s55z")),
      );
      const validated = unwrapOrThrow(PublicApi.validateTehai14(tehai));

      const results = PublicApi.rankScoresForTehai(validated, {
        agariHai: 3, // 4m
        isTsumo: false,
        jikaze: PublicApi.HaiKind.Nan,
        bakaze: PublicApi.HaiKind.Ton,
        doraMarkers: [],
      });

      expect(results).toEqual([]);
    });
  });

  describe("calculateScoreForTehai", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.calculateScoreForTehai).toBeDefined();
      expect(typeof PublicApi.calculateScoreForTehai).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.calculateScoreForTehai satisfies (
        tehai: PublicApi.Tehai14,
        config: PublicApi.ScoreCalculationConfig,
      ) => Result<PublicApi.ScoreResult, PublicApi.NoYakuError>;

      expect(true).toBe(true);
    });

    it("役が成立しない手では NoYakuError を Err として返すこと", () => {
      // 234m 234p 456s 678s + 55z(白) は役なし
      const tehai = PublicApi.tehaiToHaiKindId(
        unwrapOrThrow(PublicApi.parseMpsz("234m234p456s678s55z")),
      );
      const validated = unwrapOrThrow(PublicApi.validateTehai14(tehai));

      const result = PublicApi.calculateScoreForTehai(validated, {
        agariHai: 3, // 4m
        isTsumo: false,
        jikaze: PublicApi.HaiKind.Nan,
        bakaze: PublicApi.HaiKind.Ton,
        doraMarkers: [],
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PublicApi.NoYakuError);
      }
    });
  });

  describe("getYakumanMultiplier", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.getYakumanMultiplier).toBeDefined();
      expect(typeof PublicApi.getYakumanMultiplier).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.getYakumanMultiplier satisfies (
        yakuResult: PublicApi.YakuResult,
        ruleConfig?: PublicApi.YakumanRuleConfig,
      ) => number;

      expect(true).toBe(true);
    });
  });

  describe("calculateScore", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.calculateScore).toBeDefined();
      expect(typeof PublicApi.calculateScore).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.calculateScore satisfies (
        han: number,
        fu: PublicApi.Fu,
        config: PublicApi.CalculateScoreConfig,
      ) => PublicApi.ScoreResult;

      expect(true).toBe(true);
    });

    it("翻数・符・ルール設定から点数を計算できること", () => {
      const score = PublicApi.calculateScore(4, 30, {
        isOya: false,
        isTsumo: false,
        ruleConfig: { kiriageMangan: true },
      });

      expect(PublicApi.getPaymentTotal(score.payment)).toBe(8000);
    });
  });

  describe("ルール差分設定の型 (RuleConfig)", () => {
    it("符・点数区分・役満のルールをまとめて指定できること", () => {
      const ruleConfig = {
        doubleWindJantouFu: 4,
        kiriageMangan: true,
        suuankouTanki: true,
      } satisfies PublicApi.RuleConfig;

      // 各層のルール設定型としても受け付けられること
      ruleConfig satisfies PublicApi.FuRuleConfig;
      ruleConfig satisfies PublicApi.ScoreLevelRuleConfig;
      ruleConfig satisfies PublicApi.YakumanRuleConfig;

      expect(ruleConfig.kiriageMangan).toBe(true);
    });
  });

  describe("Parser (parseMpsz / parseExtendedMpsz / formatMpsz)", () => {
    it("関数としてエクスポートされていること", () => {
      expect(typeof PublicApi.parseMpsz).toBe("function");
      expect(typeof PublicApi.parseExtendedMpsz).toBe("function");
      expect(typeof PublicApi.formatMpsz).toBe("function");
    });

    it("parseMpsz / parseExtendedMpsz が期待される型シグネチャを満たすこと", () => {
      // パーサーは Branded ではない、牌コードの Tehai を Result で返す
      PublicApi.parseMpsz satisfies (
        input: string,
      ) => Result<Tehai<HaiCode>, PublicApi.MpszParseError>;
      PublicApi.parseExtendedMpsz satisfies (
        input: string,
      ) => Result<Tehai<HaiCode>, PublicApi.MpszParseError>;

      expect(true).toBe(true);
    });

    it("formatMpsz が期待される型シグネチャを満たし、牌種IDの手牌も渡せること", () => {
      PublicApi.formatMpsz satisfies (tehai: Tehai<HaiCode>) => string;

      const kindTehai: Tehai = {
        closed: [PublicApi.HaiKind.ManZu1],
        exposed: [],
      };
      expect(PublicApi.formatMpsz(kindTehai)).toBe("1m");
    });

    it("解釈 → 牌種IDへ変換 → 検証 → 点数計算 の流れがつながること", () => {
      // 赤 5 と副露を含む手牌。赤属性は点数には乗らない（docs/scope.md）
      const parsed = unwrapOrThrow(
        PublicApi.parseExtendedMpsz("234m340p678s[6+66s]22p"),
      );
      expect(parsed.closed).toContain(PublicApi.AkaHai.PinZu5);

      const tehai = PublicApi.tehaiToHaiKindId(parsed);
      const validated = unwrapOrThrow(PublicApi.validateTehai14(tehai));
      const result = PublicApi.calculateScoreForTehai(validated, {
        agariHai: PublicApi.HaiKind.PinZu2,
        isTsumo: false,
        jikaze: PublicApi.HaiKind.Nan,
        bakaze: PublicApi.HaiKind.Ton,
        doraMarkers: [],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.detail.yakuResult).toEqual([["Tanyao", 1]]);
      }
      // 正規形は赤属性と鳴き元を保持する
      expect(PublicApi.formatMpsz(parsed)).toBe("234m22340p678s[6+66s]");
    });
  });

  // ==========================================================================
  // エクスポートの網羅チェック
  // ==========================================================================
  // 公開している関数の一覧をここに定義します。src/index.ts からエクスポートを
  // 落とすと（意図せぬ破壊的変更）このテストが落ちます。
  // 新しく公開する関数を追加した場合はこの一覧にも追記してください。
  const EXPORTED_FUNCTIONS: readonly string[] = [
    // エラークラス
    "ChomboError",
    "DuplicatedHaiIdError",
    "InvalidHaiQuantityError",
    "MahjongArgumentError",
    "MahjongError",
    "MpszParseError",
    "NoYakuError",
    "ShoushaiError",
    "TahaiError",
    // 牌
    "validateHaiKindId",
    "validateHaiId",
    "validateHaiCode",
    "haiIdToKindId",
    "haiCodeToKindId",
    "isAkaHai",
    "compareHaiCode",
    "sortHaiCodes",
    "haiKindToNumber",
    "isKazehai",
    "isSuupai",
    "isYaochu",
    "kindIdToHaiType",
    // ドラ
    "countDora",
    "getDoraNext",
    // 面子
    "isValidKantsu",
    "isValidKoutsu",
    "isValidShuntsu",
    "isValidTatsu",
    "isValidToitsu",
    // 手牌
    "isTehai13",
    "isTehai14",
    "validateTehai",
    "validateTehai13",
    "validateTehai14",
    "tehaiToHaiKindId",
    "sortTehai",
    // 手牌配置
    "sortBlocksByTehai",
    "sortHouraBlocksByTehai",
    // 待ち・シャンテン
    "classifyMachi",
    "calculateShanten",
    "getUkeire",
    // 役・点数
    "detectYaku",
    "isMenzen",
    "calculateScore",
    "calculateScoreForTehai",
    "rankScoresForTehai",
    "getPaymentTotal",
    "getYakumanMultiplier",
    // パーサ
    "isExtendedMpsz",
    "isMpsz",
    "parseExtendedMpsz",
    "parseMpsz",
    "formatMpsz",
  ];

  describe("エクスポートの網羅", () => {
    it.each(EXPORTED_FUNCTIONS)(
      "%s が関数としてエクスポートされていること",
      (name) => {
        const api: Record<string, unknown> = PublicApi;
        expect(api[name]).toBeDefined();
        expect(typeof api[name]).toBe("function");
      },
    );
  });

  // ==========================================================================
  // 型シグネチャ（コンパイル時チェック）
  // ==========================================================================
  describe("牌に関する関数の型シグネチャ", () => {
    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.validateHaiKindId satisfies (
        value: number,
      ) => Result<HaiKindId, PublicApi.MahjongArgumentError>;
      PublicApi.validateHaiId satisfies (
        value: number,
      ) => Result<HaiId, PublicApi.MahjongArgumentError>;
      PublicApi.haiIdToKindId satisfies (id: HaiId) => HaiKindId;
      PublicApi.validateHaiCode satisfies (
        value: number,
      ) => Result<HaiCode, PublicApi.MahjongArgumentError>;
      PublicApi.haiCodeToKindId satisfies (code: HaiCode) => HaiKindId;
      PublicApi.isAkaHai satisfies (
        code: HaiCode,
      ) => code is PublicApi.AkaHaiId;
      PublicApi.tehaiToHaiKindId satisfies (tehai: Tehai<HaiCode>) => Tehai;
      PublicApi.haiKindToNumber satisfies (
        kind: HaiKindId,
      ) => number | undefined;
      PublicApi.kindIdToHaiType satisfies (
        kind: HaiKindId,
      ) => PublicApi.HaiType;
      PublicApi.isSuupai satisfies (kind: HaiKindId) => boolean;
      PublicApi.isYaochu satisfies (kind: HaiKindId) => boolean;
      PublicApi.isKazehai satisfies (kind: HaiKindId) => kind is Kazehai;

      expect(true).toBe(true);
    });
  });

  describe("牌IDのスマートコンストラクタ", () => {
    it("検証済みの牌IDを haiIdToKindId へそのまま渡せること", () => {
      const haiId = unwrapOrThrow(PublicApi.validateHaiId(111)); // 東の4枚目
      expect(PublicApi.haiIdToKindId(haiId)).toBe(PublicApi.HaiKind.Ton);
    });

    it("範囲外の数値は MahjongArgumentError を Err として返すこと", () => {
      const kindResult = PublicApi.validateHaiKindId(34);
      const haiResult = PublicApi.validateHaiId(136);
      expect(kindResult.isErr()).toBe(true);
      expect(haiResult.isErr()).toBe(true);
      if (kindResult.isErr()) {
        expect(kindResult.error).toBeInstanceOf(PublicApi.MahjongArgumentError);
      }
      if (haiResult.isErr()) {
        expect(haiResult.error).toBeInstanceOf(PublicApi.MahjongArgumentError);
      }
    });
  });

  describe("ドラに関する関数の型シグネチャ", () => {
    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.getDoraNext satisfies (indicator: HaiKindId) => HaiKindId;
      PublicApi.countDora satisfies (
        tehai: Tehai,
        indicators: readonly HaiKindId[],
      ) => number;

      expect(true).toBe(true);
    });
  });

  describe("面子の検証関数の型シグネチャ", () => {
    it("期待される型シグネチャを満たすこと", () => {
      type MentsuPredicate = (kindIds: readonly HaiKindId[]) => boolean;

      PublicApi.isValidShuntsu satisfies MentsuPredicate;
      PublicApi.isValidKoutsu satisfies MentsuPredicate;
      PublicApi.isValidKantsu satisfies MentsuPredicate;
      PublicApi.isValidToitsu satisfies MentsuPredicate;
      PublicApi.isValidTatsu satisfies MentsuPredicate;

      expect(true).toBe(true);
    });
  });

  describe("MPSZ型ガードの型シグネチャ", () => {
    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.isMpsz satisfies (
        input: string,
      ) => input is PublicApi.MpszString;
      PublicApi.isExtendedMpsz satisfies (
        input: string,
      ) => input is PublicApi.ExtendedMpszString;

      expect(true).toBe(true);
    });
  });

  describe("理牌・手牌配置 (compareHaiCode / sortHaiCodes / sortTehai / sortBlocksByTehai / sortHouraBlocksByTehai)", () => {
    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.compareHaiCode satisfies (a: HaiCode, b: HaiCode) => number;
      PublicApi.sortHaiCodes satisfies <T extends HaiCode>(
        hais: readonly T[],
      ) => T[];
      PublicApi.sortTehai satisfies <H extends Tehai<HaiCode>>(tehai: H) => H;
      PublicApi.sortBlocksByTehai satisfies <B>(
        blocks: readonly B[],
        describe: (block: B) => PublicApi.TehaiBlock,
      ) => B[];
      PublicApi.sortHouraBlocksByTehai satisfies (
        structure: PublicApi.MentsuHouraStructure,
      ) => readonly PublicApi.HouraBlock[];

      expect(true).toBe(true);
    });

    it("牌種IDの列・Tehai14 を渡すと同じ型のまま返ること", () => {
      const kinds: HaiKindId[] = [
        PublicApi.HaiKind.SouZu1,
        PublicApi.HaiKind.ManZu1,
      ];
      const sortedKinds: HaiKindId[] = PublicApi.sortHaiCodes(kinds);
      expect(sortedKinds).toEqual([
        PublicApi.HaiKind.ManZu1,
        PublicApi.HaiKind.SouZu1,
      ]);

      const tehai14 = unwrapOrThrow(
        PublicApi.validateTehai14(
          PublicApi.tehaiToHaiKindId(
            unwrapOrThrow(
              PublicApi.parseExtendedMpsz("9s11m22z[2-34p]{7=777^z}456s"),
            ),
          ),
        ),
      );
      const sorted: Tehai14 = PublicApi.sortTehai(tehai14);
      expect(PublicApi.formatMpsz(sorted)).toBe("11m456s9s22z[2-34p]{7=777^z}");
      expect(sorted.closed).toEqual([
        PublicApi.HaiKind.ManZu1,
        PublicApi.HaiKind.ManZu1,
        PublicApi.HaiKind.SouZu4,
        PublicApi.HaiKind.SouZu5,
        PublicApi.HaiKind.SouZu6,
        PublicApi.HaiKind.SouZu9,
        PublicApi.HaiKind.Nan,
        PublicApi.HaiKind.Nan,
      ]);
      // 晒した面子は鳴いた順のまま
      expect(sorted.exposed.map((m) => m.type)).toEqual(["Shuntsu", "Kantsu"]);
    });
  });

  describe("待ち・門前判定の型シグネチャ", () => {
    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.classifyMachi satisfies (
        hand: HouraStructure,
      ) => MachiType | undefined;
      PublicApi.isMenzen satisfies (tehai: Tehai14) => boolean;

      expect(true).toBe(true);
    });
  });
});
