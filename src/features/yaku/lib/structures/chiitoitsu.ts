import type { Tehai14, HaiKindId, Toitsu } from "../../../../types";
import type { ChiitoitsuHouraStructure } from "../../types";
import { countHaiKind } from "../../../../core/tehai";

/**
 * 手牌を七対子（7つの対子）として構造化する。
 */
export function getHouraStructuresForChiitoitsu(
  tehai: Tehai14,
): ChiitoitsuHouraStructure[] {
  // 七対子は門前のみ（定義によっては鳴きも許容する場合があるが、一般的には門前）
  if (tehai.exposed.length > 0) return [];

  const counts = countHaiKind(tehai.closed);
  const pairs: Toitsu[] = [];

  for (let i = 0; i < 34; i++) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kind = i as HaiKindId;
    const count = counts[kind];

    if (count === 2) {
      pairs.push({ type: "Toitsu", hais: [kind, kind] });
    } else if (count === 4) {
      // 4枚使いの七対子を認めるか（ローカルルール次第だが、通常は認めない）
      // ここでは標準的なルールに従い、4枚あっても2対子とはみなさない実装とする
      // ※4枚使い七対子を実装する場合は pairs.push(...) を2回行う
      return [];
    } else if (count > 0) {
      // 2枚でない牌がある場合は七対子不成立
      return [];
    }
  }

  if (pairs.length !== 7) return [];

  return [
    {
      type: "Chiitoitsu",
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      pairs: pairs as unknown as [
        Toitsu,
        Toitsu,
        Toitsu,
        Toitsu,
        Toitsu,
        Toitsu,
        Toitsu,
      ],
    },
  ];
}
