import { parseHex } from "./position";

export const MAX_BENCHMARK_CANDIDATES = 10_000_000;

export type BenchmarkRange = {
  start: bigint;
  end: bigint;
  total: bigint;
};

export function validateRange(
  startInput: string,
  endInput: string
): BenchmarkRange {
  const start = parseHex(startInput);
  const end = parseHex(endInput);

  if (start > end) {
    throw new Error(
      "Range start is greater than range end."
    );
  }

  return {
    start,
    end,
    total: end - start + 1n
  };
}

export function validateBenchmarkRange(
  startInput: string,
  endInput: string
): BenchmarkRange {
  const range = validateRange(
    startInput,
    endInput
  );

  if (
    range.total >
    BigInt(MAX_BENCHMARK_CANDIDATES)
  ) {
    throw new Error(
      `The selected benchmark contains ${range.total.toLocaleString(
        "en-US"
      )} candidates. The synthetic benchmark limit is ${MAX_BENCHMARK_CANDIDATES.toLocaleString(
        "en-US"
      )}.`
    );
  }

  return range;
}
