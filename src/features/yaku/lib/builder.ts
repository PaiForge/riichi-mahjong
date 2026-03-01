import type {
  HouraStructure,
  HouraContext,
  Hansu,
  Yaku,
  YakuDefinition,
  YakuName,
} from "../types";

export type YakuPredicate = (
  hand: HouraStructure,
  context: HouraContext,
) => boolean;

/**
 *
 */
export class YakuBuilder {
  private predicates: YakuPredicate[] = [];
  private hanCalculator?: (
    hand: HouraStructure,
    context: HouraContext,
  ) => Hansu | 0;

  /**
   *
   */
  constructor(private readonly yaku: Yaku) {}

  /**
   *
   */
  public require(predicate: YakuPredicate): this {
    this.predicates.push(predicate);
    return this;
  }

  /**
   *
   */
  public menzenOnly(): this {
    this.predicates.push((hand, context) => context.isMenzen);
    return this;
  }

  /**
   *
   */
  public dynamicHan(
    calculator: (hand: HouraStructure, context: HouraContext) => Hansu | 0,
  ): this {
    this.hanCalculator = calculator;
    return this;
  }

  /**
   *
   */
  public build(): YakuDefinition {
    const yaku = this.yaku;
    const predicates = this.predicates;
    const calculator = this.hanCalculator;

    return {
      yaku,
      isSatisfied(hand: HouraStructure, context: HouraContext): boolean {
        return predicates.every((pred) => pred(hand, context));
      },
      getHansu(hand: HouraStructure, context: HouraContext): Hansu | 0 {
        if (!this.isSatisfied(hand, context)) {
          return 0;
        }
        if (calculator) {
          return calculator(hand, context);
        }
        return context.isMenzen ? yaku.han.closed : yaku.han.open;
      },
    };
  }
}

/**
 *
 */
export function createYaku(
  name: YakuName,
  closedHan: Hansu,
  openHan: Hansu | 0 = 0,
): YakuBuilder {
  return new YakuBuilder({
    name,
    han: {
      closed: closedHan,
      open: openHan,
    },
  });
}
