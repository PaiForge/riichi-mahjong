import { describe, expect, it } from "vitest";
import { MahjongError, ShoushaiError, TahaiError } from "./errors";

describe("MahjongError", () => {
  it("Errorのインスタンスであること", () => {
    const error = new MahjongError("予期せぬエラーが発生しました");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("予期せぬエラーが発生しました");
    expect(error.name).toBe("MahjongError");
  });
});

describe("ShoushaiError", () => {
  it("MahjongErrorのインスタンスであること", () => {
    const error = new ShoushaiError("手牌が足りません");
    expect(error).toBeInstanceOf(MahjongError);
    expect(error.message).toBe("手牌が足りません");
    expect(error.name).toBe("ShoushaiError");
  });
});

describe("TahaiError", () => {
  it("MahjongErrorのインスタンスであること", () => {
    const error = new TahaiError("手牌が多すぎます");
    expect(error).toBeInstanceOf(MahjongError);
    expect(error.message).toBe("手牌が多すぎます");
    expect(error.name).toBe("TahaiError");
  });
});
