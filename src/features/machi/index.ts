import type { HaiKindId, Tehai13 } from "../../types";
import { countHaiKind } from "../../core/hai-count";
import { calculateMentsuTeShanten } from "../shanten";
import { asHaiKindId } from "../../utils/assertions";

/**
 * 手牌の受け入れ（有効牌）を計算する。
 * 今回は面子手のみを対象とし、七対子や国士無双は考慮しない。
 *
 * @param tehai 手牌 (13枚)
 * @returns シャンテン数を進める牌のリスト
 */
export function getUkeire(tehai: Tehai13): HaiKindId[] {
  const currentShanten = calculateMentsuTeShanten(tehai);
  const ukeireList: HaiKindId[] = [];

  // 手牌の全ての牌（純手牌 + 副露）をカウント
  const allHais: HaiKindId[] = [
    ...tehai.closed,
    ...tehai.exposed.flatMap((m) => m.hais),
  ];
  const haiCounts = countHaiKind(allHais);

  // 全34種の牌について、1枚加えてシャンテン数が下がるか試す
  for (let i = 0; i < 34; i++) {
    const tile = asHaiKindId(i);

    // 4枚使い切っている牌種はスキップ（山に残っていない）
    if (haiCounts[tile] >= 4) {
      continue;
    }

    // 手牌のコピーを作成（副作用を防ぐため、常に新しいオブジェクトで試行）
    // Tehai13に1枚足すので、厳密にはTehai14として扱う必要があるが、
    // calculateMentsuTeShanten は Tehai<HaiKindId> を受け付けるので、
    // 構造的に { closed, exposed } が適合していればOK。
    // ただし、Tehai13型に準拠したオブジェクトに1枚足すと枚数オーバーになるため、
    // バリデーションを通過させるために Tehai14 として構築するか、
    // calculateMentsuTeShanten 側が Generics で受け入れる点を利用する。

    // 配列のコピーを作成
    const newClosed = [...tehai.closed, tile];
    const newTehai = {
      closed: newClosed,
      exposed: tehai.exposed,
    };

    // シャンテン数を計算
    // ここでバリデーションエラーが出ないように、calculateMentsuTeShanten 側は validateTehai を使用している。
    const newShanten = calculateMentsuTeShanten(newTehai);

    if (newShanten < currentShanten) {
      ukeireList.push(tile);
    }
  }

  return ukeireList;
}
