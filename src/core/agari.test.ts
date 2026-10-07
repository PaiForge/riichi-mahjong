import { describe, it, expect } from "vitest";
import {
  enumerateAgariPlacements,
  expandAgariPlacements,
  isCompletedByAgari,
  isTankiAgari,
} from "./agari";
import {
  createMentsuStructureFromMpsz,
  createTehai,
  getHaiKindId,
} from "../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../features/yaku/lib/structures/mentsu-te";
import type { MentsuDecomposition } from "../types";

/** 牌姿の最初の面子分解（置き場所未確定）を返す */
function decompose(mpsz: string): MentsuDecomposition {
  const first = getHouraStructuresForMentsuTe(createTehai(mpsz))[0];
  if (first === undefined) throw new Error(`分解できません: ${mpsz}`);
  return first;
}

/** 分解の中で指定した面子の位置を返す */
function indexOf(decomposition: MentsuDecomposition, mpsz: string): number {
  const hais = createTehai(mpsz).closed;
  return decomposition.fourMentsu.findIndex(
    (m) =>
      m.hais.length === hais.length && m.hais.every((h, i) => h === hais[i]),
  );
}

describe("和了牌の置き場所の列挙 (enumerateAgariPlacements)", () => {
  it("雀頭と順子の両方に入る和了牌は、雀頭 → 面子の順に候補を列挙すること", () => {
    // 345m 345m 55m 123s 456s の 5m
    const d = decompose("33445555m123456s");
    const placements = enumerateAgariPlacements(d, getHaiKindId("5m"));

    expect(placements).toEqual([
      { kind: "Jantou", hai: getHaiKindId("5m") },
      { kind: "Mentsu", index: indexOf(d, "345m"), hai: getHaiKindId("5m") },
    ]);
  });

  it("同じ面子が2つあっても置き場所としては1つに数えること", () => {
    // 345m 345m のどちらに 5m を入れても同じ和了形
    const d = decompose("33445555m123456s");
    const mentsuPlacements = enumerateAgariPlacements(
      d,
      getHaiKindId("5m"),
    ).filter((p) => p.kind === "Mentsu");

    expect(mentsuPlacements).toHaveLength(1);
  });

  it("刻子と順子の両方に入る和了牌は両方を候補にすること", () => {
    // 222m 234m 555z 678s 33s の 2m
    const d = decompose("222234m555z678s33s");
    const placements = enumerateAgariPlacements(d, getHaiKindId("2m"));

    expect(placements).toHaveLength(2);
    expect(placements.map((p) => p.kind)).toEqual(["Mentsu", "Mentsu"]);
    const indices = placements.flatMap((p) =>
      p.kind === "Mentsu" ? [p.index] : [],
    );
    expect(indices).toContain(indexOf(d, "222m"));
    expect(indices).toContain(indexOf(d, "234m"));
  });

  it("副露した面子は和了牌の置き場所にならないこと", () => {
    // [222m] 234m 555z 678s 33s の 2m: ポンした 222m は和了より前に完成している
    const d = decompose("234m555z678s33s[2=22m]");
    const placements = enumerateAgariPlacements(d, getHaiKindId("2m"));

    expect(placements).toEqual([
      { kind: "Mentsu", index: indexOf(d, "234m"), hai: getHaiKindId("2m") },
    ]);
  });

  it("槓子は和了牌の置き場所にならないこと", () => {
    // (1111m) 234m 555z 678s 33s の 3s: 暗槓は和了牌で完成しない
    const d = decompose("234m555z678s33s(1111m)");
    const placements = enumerateAgariPlacements(d, getHaiKindId("1m"));

    expect(placements).toEqual([]);
  });

  it("和了牌が手牌に無ければ候補が無いこと", () => {
    const d = decompose("123m456p789s11122z");
    expect(enumerateAgariPlacements(d, getHaiKindId("9m"))).toEqual([]);
  });
});

describe("置き場所ごとの和了構造への展開 (expandAgariPlacements)", () => {
  it("候補ごとに agari を持つ和了構造を返すこと", () => {
    const d = decompose("33445555m123456s");
    const structures = expandAgariPlacements(d, getHaiKindId("5m"));

    expect(structures).toHaveLength(2);
    expect(structures.map((s) => s.agari.kind)).toEqual(["Jantou", "Mentsu"]);
    for (const s of structures) {
      expect(s.fourMentsu).toBe(d.fourMentsu);
      expect(s.jantou).toBe(d.jantou);
    }
  });
});

describe("置き場所の判定 (isCompletedByAgari / isTankiAgari)", () => {
  it("和了牌が完成させた面子の位置だけが真になること", () => {
    const hand = createMentsuStructureFromMpsz("222234m555z678s33s", {
      hai: "2m",
      in: "234m",
    });
    const target = indexOf(hand, "234m");

    for (const index of [0, 1, 2, 3] as const) {
      expect(isCompletedByAgari(hand, index)).toBe(index === target);
    }
    expect(isTankiAgari(hand)).toBe(false);
  });

  it("雀頭で和了した場合はどの面子も真にならないこと", () => {
    const hand = createMentsuStructureFromMpsz("33445555m123456s", {
      hai: "5m",
      in: "Jantou",
    });

    for (const index of [0, 1, 2, 3] as const) {
      expect(isCompletedByAgari(hand, index)).toBe(false);
    }
    expect(isTankiAgari(hand)).toBe(true);
  });
});
