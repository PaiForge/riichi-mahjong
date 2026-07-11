import type {
  HouraStructure,
  HouraContext,
  Hansu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
  YakuName,
} from "../types";

/**
 * 役の成立条件を表す述語関数。
 */
export type YakuPredicate = (
  hand: HouraStructure,
  context: HouraContext,
) => boolean;

type HansuCalculator = (
  hand: HouraStructure,
  context: HouraContext,
) => Hansu | 0;

/**
 * 役定義 (YakuDefinition) を組み立てる不変ビルダー。
 *
 * require / dynamicHan は自身を変更せず、条件を追加した新しいビルダーを返す。
 */
export interface YakuBuilder {
  /** 成立条件を追加した新しいビルダーを返す */
  readonly require: (predicate: YakuPredicate) => YakuBuilder;
  /** 翻数を動的に算出する関数を設定した新しいビルダーを返す（例: 四暗刻単騎のダブル役満） */
  readonly dynamicHan: (calculator: HansuCalculator) => YakuBuilder;
  /** 役定義を確定する */
  readonly build: () => YakuDefinition;
}

/**
 * 内部状態（役・条件リスト・翻数計算関数）を引数で受け渡す不変ビルダーの実装。
 */
function createBuilder(
  yaku: Yaku,
  predicates: readonly YakuPredicate[],
  hanCalculator: HansuCalculator | undefined,
): YakuBuilder {
  return {
    require: (predicate) =>
      createBuilder(yaku, [...predicates, predicate], hanCalculator),
    dynamicHan: (calculator) => createBuilder(yaku, predicates, calculator),
    build: () => {
      const isSatisfied: YakuPredicate = (hand, context) =>
        predicates.every((pred) => pred(hand, context));

      return {
        yaku,
        isSatisfied,
        getHansu: (hand, context) => {
          if (!isSatisfied(hand, context)) {
            return 0;
          }
          if (hanCalculator) {
            return hanCalculator(hand, context);
          }
          return context.isMenzen ? yaku.han.closed : yaku.han.open;
        },
      };
    },
  };
}

/**
 * 役名と翻数設定から YakuBuilder を生成する。
 */
export function createYaku(name: YakuName, han: YakuHanConfig): YakuBuilder {
  return createBuilder({ name, han }, [], undefined);
}
