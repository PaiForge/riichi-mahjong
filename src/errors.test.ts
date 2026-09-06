import { describe, expect, it } from "vitest";
import {
  ChomboError,
  MahjongArgumentError,
  MahjongError,
  ShoushaiError,
  TahaiError,
  MspzParseError,
} from "./errors";

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

describe("MspzParseError", () => {
  it("MahjongErrorのインスタンスであること", () => {
    const error = new MspzParseError("Invalid MSPZ string: abc");
    expect(error).toBeInstanceOf(MahjongError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Invalid MSPZ string: abc");
    expect(error.name).toBe("MspzParseError");
  });

  it("デフォルトメッセージが設定されること", () => {
    const error = new MspzParseError();
    expect(error.message).toBe("MSPZ文字列の解析に失敗しました。");
  });
});

describe("MahjongArgumentError", () => {
  it("MahjongErrorのインスタンスであること", () => {
    const error = new MahjongArgumentError("引数が不正です");
    expect(error).toBeInstanceOf(MahjongError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("引数が不正です");
    expect(error.name).toBe("MahjongArgumentError");
  });
});

describe("ChomboError", () => {
  it("MahjongErrorのインスタンスであること", () => {
    const error = new ChomboError("和了れない手です");
    expect(error).toBeInstanceOf(MahjongError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("和了れない手です");
    expect(error.name).toBe("ChomboError");
  });

  it("デフォルトメッセージが設定されること", () => {
    const error = new ChomboError();
    expect(error.message).toBe("不正な和了です。");
  });
});
