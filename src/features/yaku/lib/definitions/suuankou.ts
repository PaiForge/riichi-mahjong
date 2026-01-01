import type {
  HouraStructure,
  Kantsu,
  Koutsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HouraContext } from "../../types";

const SUUANKOU_YAKU: Yaku = {
  name: "Suuankou",
  han: {
    open: 0, // 門前限定（構造上必然的にそうなるが、定義としても門前）
    closed: 13, // 通常役満(13) または ダブル役満(26)
  } satisfies YakuHanConfig,
};

const checkSuuankou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 刻子・槓子を抽出
  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  let ankouCount = 0;

  for (const triplet of triplets) {
    // 副露している刻子は暗刻ではない
    if (triplet.furo) continue;

    const isAgariHaiInTriplet = triplet.hais.includes(context.agariHai);

    const isTanki = hand.jantou.hais[0] === context.agariHai;

    if (context.isTsumo) {
      // ツモなら、副露していなければ全て暗刻
      ankouCount++;
    } else {
      // ロン和了の場合
      if (isAgariHaiInTriplet) {
        // 和了牌を含む刻子（シャボ待ちロン）は明刻
        // 単騎待ちロンなら暗刻
        if (isTanki) {
          ankouCount++;
        }
      } else {
        // 和了牌を含まない刻子は暗刻
        ankouCount++;
      }
    }
  }

  return ankouCount === 4;
};

// 四暗刻はダブル役満（単騎待ち）判定が必要なため、
// createYakuDefinitionのデフォルトのgetHansuロジックをオーバーライドするか、
// このcheck関数内で判定してフラグを渡すなどの工夫が必要。
// しかし createYakuDefinition は boolean を返す check 関数しか受け取らない。
// ここでは factory 側を拡張するのではなく、この定義でカスタム実装を行うか、
// あるいは factory を通さずに直接 YakuDefinition を作る。
// factoryの改修はスコープ外のため、ここではオブジェクトリテラルで定義を作成する。

export const suuankouDefinition: YakuDefinition = {
  yaku: SUUANKOU_YAKU,
  isSatisfied: (hand, context) => checkSuuankou(hand, context),
  getHansu: (hand, context) => {
    if (!checkSuuankou(hand, context)) return 0;

    // 四暗刻単騎の判定
    const isTanki =
      hand.type === "Mentsu" && hand.jantou.hais[0] === context.agariHai;

    // 単騎待ちならダブル役満(26)
    if (isTanki) {
      return 26;
    }

    return 13;
  },
};
