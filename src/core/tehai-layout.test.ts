import { describe, expect, it } from "vitest";
import { AkaHai, HaiKind, Tacha } from "../types";
import type { CompletedMentsu, HaiCode, HaiKindId } from "../types";
import {
  createKoutsu,
  createMentsuStructure,
  createMentsuStructureFromMpsz,
  createShuntsu,
  createToitsu,
} from "../utils/test-helpers";
import {
  sortBlocksByTehai,
  sortHouraBlocksByTehai,
  type HouraBlock,
} from "./tehai-layout";

interface NamedBlock {
  readonly name: string;
  readonly hais: readonly HaiCode[];
  readonly isExposed: boolean;
}

const block = (
  name: string,
  hais: readonly HaiCode[],
  isExposed = false,
): NamedBlock => ({ name, hais, isExposed });

const namesOf = (blocks: readonly NamedBlock[]): string[] =>
  sortBlocksByTehai(blocks, (b) => b).map((b) => b.name);

describe("sortBlocksByTehai (ブロックを手牌の並びの順に並べる)", () => {
  it("手の内のブロックを萬子 → 筒子 → 索子 → 字牌（東南西北白發中）の順に並べる", () => {
    expect(
      namesOf([
        block("中", [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun]),
        block("索子", [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8]),
        block("東", [HaiKind.Ton, HaiKind.Ton]),
        block("白", [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku]),
        block("筒子", [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6]),
        block("萬子", [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]),
      ]),
    ).toEqual(["萬子", "筒子", "索子", "東", "白", "中"]);
  });

  it("同じ色では牌の列の辞書順で、接頭辞なら短い方（雀頭）が先", () => {
    expect(
      namesOf([
        block("555m", [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5]),
        block("55m", [HaiKind.ManZu5, HaiKind.ManZu5]),
        block("456m", [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6]),
        block("567m", [HaiKind.ManZu5, HaiKind.ManZu6, HaiKind.ManZu7]),
      ]),
    ).toEqual(["456m", "55m", "555m", "567m"]);
  });

  it("ブロックの牌は理牌してから比べる（渡した順には依存しない）", () => {
    expect(
      namesOf([
        block("順子", [HaiKind.ManZu3, HaiKind.ManZu1, HaiKind.ManZu2]),
        block("雀頭", [HaiKind.ManZu1, HaiKind.ManZu1]),
      ]),
    ).toEqual(["雀頭", "順子"]);
  });

  it("赤 5 を含むブロックは通常の 5 のブロックの後ろに置く", () => {
    expect(
      namesOf([
        block("406p", [HaiKind.PinZu4, AkaHai.PinZu5, HaiKind.PinZu6]),
        block("456p", [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6]),
        block("55p", [HaiKind.PinZu5, HaiKind.PinZu5]),
        block("50p", [HaiKind.PinZu5, AkaHai.PinZu5]),
      ]),
    ).toEqual(["456p", "406p", "55p", "50p"]);
  });

  it("同じ牌のブロックは元の順を保つ（安定ソート）", () => {
    const hais: HaiKindId[] = [HaiKind.SouZu2, HaiKind.SouZu3, HaiKind.SouZu4];
    expect(
      namesOf([
        block("中", [HaiKind.Chun, HaiKind.Chun]),
        block("順子A", hais),
        block("順子B", hais),
        block("順子C", hais),
      ]),
    ).toEqual(["順子A", "順子B", "順子C", "中"]);
  });

  it("晒したブロックは手の内の後ろに、元の順のまま置く", () => {
    expect(
      namesOf([
        block("副露 中", [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun], true),
        block("索子", [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3]),
        block(
          "副露 萬子",
          [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
          true,
        ),
        block("東", [HaiKind.Ton, HaiKind.Ton]),
        block(
          "暗槓 筒子",
          [HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9],
          true,
        ),
      ]),
    ).toEqual(["索子", "東", "副露 中", "副露 萬子", "暗槓 筒子"]);
  });

  it("引数の配列を変更せず、新しい配列を返す", () => {
    const blocks = [
      block("索子", [HaiKind.SouZu1]),
      block("萬子", [HaiKind.ManZu1]),
    ];
    const sorted = sortBlocksByTehai(blocks, (b) => b);
    expect(sorted).not.toBe(blocks);
    expect(blocks.map((b) => b.name)).toEqual(["索子", "萬子"]);
    expect(sorted.map((b) => b.name)).toEqual(["萬子", "索子"]);
    expect(sortBlocksByTehai([], (b: NamedBlock) => b)).toEqual([]);
  });
});

describe("sortHouraBlocksByTehai (和了構造のブロックを手牌の並びの順に並べる)", () => {
  /** 並べた結果を「雀頭 / 面子の添字」の列にする */
  const keysOf = (blocks: readonly HouraBlock[]): string[] =>
    blocks.map((b) => (b.kind === "Jantou" ? "jantou" : `mentsu${b.index}`));

  it("雀頭を面子の間に混ぜ、手の内のブロックを牌の順に並べる", () => {
    const structure = createMentsuStructure(
      [
        createShuntsu("789s"),
        createKoutsu("111z"),
        createShuntsu("123m"),
        createShuntsu("456p"),
      ],
      createToitsu("99m"),
    );
    const sorted = sortHouraBlocksByTehai(structure);
    expect(keysOf(sorted)).toEqual([
      "mentsu2",
      "jantou",
      "mentsu3",
      "mentsu0",
      "mentsu1",
    ]);
    expect(sorted[1]?.block).toBe(structure.jantou);
    expect(sorted[0]?.block).toBe(structure.fourMentsu[2]);
  });

  it("副露と暗槓は手の内の後ろに fourMentsu の順で置き、雀頭は手の内に残る", () => {
    const chi: CompletedMentsu = {
      type: "Shuntsu",
      hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
      furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: HaiKind.ManZu1 },
    };
    const ankan: CompletedMentsu = {
      type: "Kantsu",
      hais: [HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1, HaiKind.PinZu1],
    };
    const pon: CompletedMentsu = {
      type: "Koutsu",
      hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
      furo: { type: "Pon", from: Tacha.Toimen, nakiHai: HaiKind.Haku },
    };
    const structure = createMentsuStructure(
      [pon, createShuntsu("789s"), ankan, chi],
      createToitsu("77z"),
    );
    expect(keysOf(sortHouraBlocksByTehai(structure))).toEqual([
      "mentsu1",
      "jantou",
      "mentsu0",
      "mentsu2",
      "mentsu3",
    ]);
  });

  it("同じ面子が 2 つある手（一盃口）は fourMentsu の順を保つ", () => {
    const structure = createMentsuStructureFromMpsz("223344m567p789s11z");
    const sorted = sortHouraBlocksByTehai(structure);
    const same = sorted.filter(
      (b) => b.kind === "Mentsu" && b.block.hais[0] === HaiKind.ManZu2,
    );
    expect(same.map((b) => (b.kind === "Mentsu" ? b.index : -1))).toEqual(
      [...same.map((b) => (b.kind === "Mentsu" ? b.index : -1))].sort(
        (a, b) => a - b,
      ),
    );
    expect(keysOf(sorted).at(-1)).toBe("jantou");
  });

  it("kind と index で和了牌の置き場所と突き合わせられる", () => {
    const structure = createMentsuStructureFromMpsz("123m456p789s111z22z", {
      hai: "1m",
      in: "123m",
    });
    const agari = structure.agari;
    const found = sortHouraBlocksByTehai(structure).find(
      (b) =>
        b.kind === agari.kind &&
        (b.kind === "Jantou" ||
          (agari.kind === "Mentsu" && b.index === agari.index)),
    );
    expect(found?.block.hais).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
    ]);
  });
});
