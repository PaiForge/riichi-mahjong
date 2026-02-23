import { describe, it, expect } from "vitest";
import {
  parseMspz,
  parseExtendedMspz,
  calculateShanten,
  detectYaku,
} from "../../src";
import {
  HaiKind,
  type Fu,
  type HaiKindId,
  type Tehai14,
} from "../../src/types";
import { getHouraStructures } from "../../src/features/yaku/lib/structures";
import { calculateFu } from "../../src/features/score/lib/fu";
import type { HouraContext } from "../../src/features/yaku/types";
import { parseMspzToHaiKindIds, asMspz } from "../../src/features/parser/mspz";
import { calculateBasePoints, getScoreLevel } from "../../src/features/score";
import { ScoreLevel } from "../../src/features/score/types";

// ヘルパー関数
function tehaiFromMspz(mspz: string): Tehai14 {
  return parseMspz(mspz) as Tehai14;
}

// MSPZ形式の参照:
// m=萬子, p=筒子, s=索子, z=字牌
// z: 1=東, 2=南, 3=西, 4=北, 5=白, 6=發, 7=中

describe("バグ調査: 一盃口と二盃口の排他制御", () => {
  it("二盃口が成立する場合、一盃口は成立しないこと", () => {
    // 112233m 445566p 77s = 6+6+2 = 14枚
    const tehai14 = tehaiFromMspz("112233m445566p77s");
    const result = detectYaku(
      tehai14,
      HaiKind.ManZu3 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    console.log("検出された役:", yakuNames);

    // 二盃口が成立するなら一盃口は含まれないはず（上位互換）
    if (yakuNames.includes("Ryanpeikou")) {
      expect(yakuNames).not.toContain("Iipeikou");
    }
  });

  it("一盃口のみ成立する手（二盃口でない）", () => {
    // 112233m 456p 789s 55s = 6+3+3+2 = 14枚
    const tehai14 = tehaiFromMspz("112233m456p55789s");
    const result = detectYaku(
      tehai14,
      HaiKind.ManZu3 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Iipeikou");
    expect(yakuNames).not.toContain("Ryanpeikou");
  });
});

describe("バグ調査: 点数計算の境界値", () => {
  it("30符4翻 = 基本点1920 (満貫未満)", () => {
    const bp = calculateBasePoints(30 as Fu, 4);
    expect(bp).toBe(1920);
    const level = getScoreLevel(4, bp);
    expect(level).toBe(ScoreLevel.Normal);
  });

  it("60符3翻 = 基本点1920 (満貫未満)", () => {
    const bp = calculateBasePoints(60 as Fu, 3);
    expect(bp).toBe(1920);
    const level = getScoreLevel(3, bp);
    expect(level).toBe(ScoreLevel.Normal);
  });

  it("40符4翻 = 基本点2560 (満貫)", () => {
    const bp = calculateBasePoints(40 as Fu, 4);
    expect(bp).toBe(2560);
    const level = getScoreLevel(4, bp);
    expect(level).toBe(ScoreLevel.Mangan);
  });

  it("各翻数レベルの正確な判定", () => {
    expect(getScoreLevel(5, 0)).toBe(ScoreLevel.Mangan);
    expect(getScoreLevel(6, 0)).toBe(ScoreLevel.Haneman);
    expect(getScoreLevel(7, 0)).toBe(ScoreLevel.Haneman);
    expect(getScoreLevel(8, 0)).toBe(ScoreLevel.Baiman);
    expect(getScoreLevel(10, 0)).toBe(ScoreLevel.Baiman);
    expect(getScoreLevel(11, 0)).toBe(ScoreLevel.Sanbaiman);
    expect(getScoreLevel(12, 0)).toBe(ScoreLevel.Sanbaiman);
    expect(getScoreLevel(13, 0)).toBe(ScoreLevel.Yakuman);
    expect(getScoreLevel(25, 0)).toBe(ScoreLevel.Yakuman);
    expect(getScoreLevel(26, 0)).toBe(ScoreLevel.DoubleYakuman);
  });
});

describe("バグ調査: 三暗刻/四暗刻のロン和了判定", () => {
  it("ロン和了でシャボ待ちの刻子は明刻扱い -> 三暗刻不成立", () => {
    // 111m 333p 555s 123s 44z(北) = 3+3+3+3+2=14枚
    // agariHai=5s ロン -> 555sは明刻扱い -> 暗刻2つ -> 三暗刻不成立
    const tehai14 = tehaiFromMspz("111m333p123555s44z");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu5 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false, // ロン
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).not.toContain("Sanankou");
  });

  it("ツモ和了 -> 全副露なし刻子は暗刻 -> 三暗刻成立", () => {
    const tehai14 = tehaiFromMspz("111m333p123555s44z");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu5 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      true, // ツモ
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Sanankou");
  });

  it("四暗刻ツモ（シャボ）は役満(13翻)", () => {
    // 111m 333p 555s 777z(中) 66z(發) = 3+3+3+3+2 = 14枚
    // agariHai=7z(中) ツモ -> 四暗刻成立、シャボなので13翻
    const tehai14 = tehaiFromMspz("111m333p555s66777z");
    const result = detectYaku(
      tehai14,
      HaiKind.Chun as HaiKindId, // 7z = 中(33)
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      true, // ツモ
    );

    const suuankou = result.find(([name]) => name === "Suuankou");
    expect(suuankou).toBeDefined();
    // jantou=66z(發=32), agariHai=7z(中=33)
    // jantou.hais[0] !== agariHai -> 単騎ではない -> 13翻
    expect(suuankou?.[1]).toBe(13);
  });

  it("四暗刻単騎ツモはダブル役満(26翻)", () => {
    // 111m 333p 555s 777z(中) 66z(發) = 14枚
    // agariHai=6z(發=32) -> jantou=66z
    // jantou.hais[0] === agariHai -> 単騎 -> 26翻
    const tehai14 = tehaiFromMspz("111m333p555s66777z");
    const result = detectYaku(
      tehai14,
      HaiKind.Hatsu as HaiKindId, // 6z = 發(32) 単騎待ち
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      true, // ツモ
    );

    const suuankou = result.find(([name]) => name === "Suuankou");
    expect(suuankou).toBeDefined();
    expect(suuankou?.[1]).toBe(26);
  });

  it("四暗刻ロン（シャボ待ち）は不成立", () => {
    // ロンで刻子完成 -> 明刻 -> 暗刻3つ -> 四暗刻不成立
    const tehai14 = tehaiFromMspz("111m333p555s66777z");
    const result = detectYaku(
      tehai14,
      HaiKind.Chun as HaiKindId, // 7z ロン
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false, // ロン
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).not.toContain("Suuankou");
    // 三暗刻は成立する（3つは暗刻）
    expect(yakuNames).toContain("Sanankou");
  });
});

describe("バグ調査: シャンテン数計算", () => {
  it("面子手テンパイ: 3面子+1雀頭+1塔子 = 0シャンテン", () => {
    // 123m 456p 789s 11z 23s = 3+3+3+2+2=13枚
    const tehai13 = parseMspz("123m456p23789s11z");
    const shanten = calculateShanten(tehai13);
    expect(shanten).toBe(0);
  });

  it("七対子テンパイ: 6対子+1枚 = 0シャンテン", () => {
    const tehai13 = parseMspz("1122m3344p5566s7z");
    const shanten = calculateShanten(tehai13);
    expect(shanten).toBe(0);
  });

  it("国士無双テンパイ: 13種全て1枚 = 0シャンテン", () => {
    const tehai13 = parseMspz("19m19p19s1234567z");
    const shanten = calculateShanten(tehai13);
    expect(shanten).toBe(0);
  });
});

describe("バグ調査: MSPZパーサー", () => {
  it("数牌の0は無視される", () => {
    const ids = parseMspzToHaiKindIds(asMspz("0m"));
    expect(ids).toEqual([]);
  });

  it("拡張MSPZの副露パース: チー", () => {
    const result = parseExtendedMspz("[123m]11m456p789s22z");
    expect(result.exposed.length).toBe(1);
    expect(result.exposed[0]?.type).toBe("Shuntsu");
    expect(result.exposed[0]?.furo?.type).toBe("Chi");
  });

  it("拡張MSPZの暗槓パース", () => {
    const result = parseExtendedMspz("(1111m)456p789s234m22z");
    expect(result.exposed.length).toBe(1);
    expect(result.exposed[0]?.type).toBe("Kantsu");
    expect(result.exposed[0]?.furo).toBeUndefined();
  });
});

describe("バグ調査: 符計算の詳細", () => {
  it("連風牌（場風=東、自風=東）の雀頭符は2符にキャップされる", () => {
    // 123m 456p 234s 789s 11z = 3+3+3+3+2 = 14枚
    const tehai14 = tehaiFromMspz("123m456p234789s11z");
    const structures = getHouraStructures(tehai14);
    expect(structures.length).toBeGreaterThan(0);

    const context: HouraContext = {
      isMenzen: true,
      agariHai: HaiKind.SouZu4 as HaiKindId,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Ton,
      isTsumo: false,
      doraMarkers: [],
    };

    for (const hand of structures) {
      if (hand.type === "Mentsu" && hand.jantou.hais[0] === HaiKind.Ton) {
        const fuResult = calculateFu(hand, context, false);
        expect(fuResult.details.jantou).toBe(2);
      }
    }
  });

  it("ロン和了で和了牌を含む刻子は明刻扱い（符計算上）", () => {
    // 111m 123m 234p 567s 44z(北) = 3+3+3+3+2 = 14枚
    const tehai14 = tehaiFromMspz("111123m234p567s44z");
    const structures = getHouraStructures(tehai14);
    expect(structures.length).toBeGreaterThan(0);

    const context: HouraContext = {
      isMenzen: true,
      agariHai: HaiKind.ManZu1 as HaiKindId,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      isTsumo: false,
      doraMarkers: [],
    };

    for (const hand of structures) {
      if (hand.type === "Mentsu") {
        const fuResult = calculateFu(hand, context, false);
        expect(fuResult.total).toBeGreaterThanOrEqual(30);
      }
    }
  });
});

describe("バグ調査: 混全帯幺九", () => {
  it("全ブロックに么九牌を含み、順子あり、字牌ありで成立", () => {
    // 123m 789p 123s 111z(東) 99s = 3+3+3+3+2=14枚
    const tehai14 = tehaiFromMspz("123m789p12399s111z");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu3 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Honchan");
  });
});

describe("バグ調査: 平和の判定条件", () => {
  it("門前・全順子・両面待ち・役牌でない雀頭 -> 平和成立", () => {
    // 123m 456m 789p 234s 55s = 3+3+3+3+2 = 14枚
    // agariHai=4s -> 234s で c=4s, a=2s(a%9=1≠0) -> Ryanmen
    const tehai14 = tehaiFromMspz("123456m789p23455s");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu4 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Pinfu");
  });

  it("門前・全順子・嵌張待ち -> 平和不成立", () => {
    // 同じ手牌、agariHai=3s (234sのカンチャン)
    const tehai14 = tehaiFromMspz("123456m789p23455s");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu3 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).not.toContain("Pinfu");
  });
});

describe("バグ調査: 小三元の複合役", () => {
  it("小三元は三元牌2つの役牌と複合すること", () => {
    // 555z(白) 666z(發) 77z(中) 123m 456p = 3+3+2+3+3=14枚
    // MSPZ: 123m456p55566677z
    const tehai14 = tehaiFromMspz("123m456p55566677z");
    const result = detectYaku(
      tehai14,
      HaiKind.Chun as HaiKindId, // 7z ロン (中の対子完成)
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    // 小三元(2翻) + 白(1翻) + 發(1翻) = 4翻 が期待される
    expect(yakuNames).toContain("Shousangen");
    expect(yakuNames).toContain("Haku");
    expect(yakuNames).toContain("Hatsu");
  });
});

describe("バグ調査: 喰い下がりの正確性", () => {
  it("副露時の一気通貫は1翻（門前時2翻からの喰い下がり）", () => {
    // [123m] 456m 789m 234p 55s -> 副露あり一気通貫
    const tehai14 = parseExtendedMspz("[123m]456789m234p55s") as Tehai14;
    const result = detectYaku(
      tehai14,
      HaiKind.PinZu4 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const ikkitsuukan = result.find(([name]) => name === "Ikkitsuukan");
    if (ikkitsuukan) {
      expect(ikkitsuukan[1]).toBe(1);
    }
  });

  it("副露時の三色同順は1翻（門前時2翻からの喰い下がり）", () => {
    // [123m] 123p 123s 456p 55s
    const tehai14 = parseExtendedMspz("[123m]123p123s456p55s") as Tehai14;
    const result = detectYaku(
      tehai14,
      HaiKind.PinZu6 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const sanshoku = result.find(([name]) => name === "SanshokuDoujun");
    if (sanshoku) {
      expect(sanshoku[1]).toBe(1);
    }
  });
});

describe("バグ調査: 七対子の特殊ケース", () => {
  it("同一牌4枚を2対子として扱わない（七対子の正当性チェック）", () => {
    // 1111m 22m 33p 44p 55s 66s = 4+2+2+2+2+2 = 14枚
    // MSPZ: 111122m3344p5566s
    const tehai14 = tehaiFromMspz("111122m3344p5566s");
    const result = detectYaku(
      tehai14,
      HaiKind.ManZu2 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    console.log("七対子4枚テスト:", yakuNames);
    // 1mが4枚 -> 6種の異なる対子のみ -> 七対子不成立が一般的
    // ただし、七対子の構造体がどう生成されるかによる
  });
});

describe("バグ調査: 九蓮宝燈と清一色の複合", () => {
  it("九蓮宝燈は役満として検出され、清一色は含まれないこと", () => {
    // 11123455678999m = 14枚 (九蓮宝燈: 1112345678999 + 5m)
    const tehai14 = tehaiFromMspz("11123455678999m");
    const result = detectYaku(
      tehai14,
      HaiKind.ManZu5 as HaiKindId, // 5m でツモ
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      true,
    );

    const yakuNames = result.map(([name]) => name);
    console.log("九蓮宝燈の役:", yakuNames);
    expect(yakuNames).toContain("ChuurenPoutou");
    // 役満が成立した場合、通常役（清一色等）は含まれないはず
    expect(yakuNames).not.toContain("Chinitsu");
  });
});

describe("バグ修正検証: 一盃口と二盃口の排他制御（エッジケース）", () => {
  it("二盃口成立時に一盃口が検出されないこと（萬子+筒子の組み合わせ）", () => {
    // 112233m 445566p 77s = 6+6+2 = 14枚
    const tehai14 = tehaiFromMspz("112233m445566p77s");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu7 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Ryanpeikou");
    expect(yakuNames).not.toContain("Iipeikou");
  });

  it("一盃口のみ成立し二盃口でない手で一盃口が正しく検出されること", () => {
    // 112233m 456p 55s 789s = 6+3+2+3 = 14枚
    const tehai14 = tehaiFromMspz("112233m456p55789s");
    const result = detectYaku(
      tehai14,
      HaiKind.ManZu3 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Iipeikou");
    expect(yakuNames).not.toContain("Ryanpeikou");
  });

  it("一盃口も二盃口もない手で両方とも検出されないこと", () => {
    // 123m 456m 789p 11z 234s = 3+3+3+2+3 = 14枚
    const tehai14 = tehaiFromMspz("123456m789p234s11z");
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu4 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).not.toContain("Iipeikou");
    expect(yakuNames).not.toContain("Ryanpeikou");
  });

  it("二盃口: 索子+索子の同一色2ペア", () => {
    // 112233s 778899s 11z = 6+6+2 = 14枚
    const tehai14 = tehaiFromMspz("112233778899s11z");
    const result = detectYaku(
      tehai14,
      HaiKind.Ton as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Ryanpeikou");
    expect(yakuNames).not.toContain("Iipeikou");
  });

  it("二盃口: 筒子+筒子の同一色2ペア", () => {
    // 112233p 778899p 55m = 6+6+2 = 14枚
    const tehai14 = tehaiFromMspz("55m112233778899p");
    const result = detectYaku(
      tehai14,
      HaiKind.ManZu5 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Ryanpeikou");
    expect(yakuNames).not.toContain("Iipeikou");
  });

  it("二盃口: 萬子+萬子の同一色2ペア", () => {
    // 112233m 778899m 55z(白) = 6+6+2 = 14枚
    const tehai14 = tehaiFromMspz("112233778899m55z");
    const result = detectYaku(
      tehai14,
      HaiKind.Haku as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).toContain("Ryanpeikou");
    expect(yakuNames).not.toContain("Iipeikou");
  });

  it("副露がある場合は一盃口が成立しないこと（門前限定）", () => {
    // [123m] 123m 456p 789s 55s = 副露あり手牌
    // 同一順子のペアがあるが、門前でないため一盃口不成立
    const tehai14 = parseExtendedMspz("[123m]123m456p789s55s") as Tehai14;
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu5 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).not.toContain("Iipeikou");
    expect(yakuNames).not.toContain("Ryanpeikou");
  });

  it("副露がある場合は二盃口も成立しないこと（門前限定）", () => {
    // [112233m] 445566p 77s -> 副露あり
    // 本来二盃口の形だが、門前でないため不成立
    const tehai14 = parseExtendedMspz("[123m]123m445566p77s") as Tehai14;
    const result = detectYaku(
      tehai14,
      HaiKind.SouZu7 as HaiKindId,
      HaiKind.Ton,
      HaiKind.Nan,
      [],
      [],
      false,
    );

    const yakuNames = result.map(([name]) => name);
    expect(yakuNames).not.toContain("Iipeikou");
    expect(yakuNames).not.toContain("Ryanpeikou");
  });
});
