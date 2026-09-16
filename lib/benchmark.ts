import { parseHex } from "./position";

export const MAX_BENCHMARK_CANDIDATES = 10_000_000;

export type BenchmarkRange = {
  start: bigint;
  end: bigint;
  total: bigint;
};

export type BenchmarkProgress = {
  checked: number;
  total: number;
  percentage: number;
  currentCandidate: string;
  candidatesPerSecond: number;
  elapsedMs: number;
};

export type BenchmarkResult = {
  found: boolean;
  candidate?: string;
  matchToken?: string;
  candidatesChecked: number;
  elapsedMs: number;
  candidatesPerSecond: number;
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
      `This synthetic calculation contains ${range.total.toLocaleString(
        "en-US"
      )} candidates. The executable synthetic benchmark is limited to ${MAX_BENCHMARK_CANDIDATES.toLocaleString(
        "en-US"
      )} candidates.`
    );
  }

  return range;
}

/**
 * Browser-safe SHA-256.
 *
 * The input is the normalized 64-character
 * hexadecimal representation of a candidate.
 */
export async function hashCandidate(
  candidate: bigint
): Promise<string> {
  const normalized = candidate
    .toString(16)
    .padStart(64, "0");

  const data = new TextEncoder().encode(
    normalized
  );

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export async function runBenchmark(
  startInput: string,
  endInput: string,
  targetHash: string,
  onProgress?: (
    progress: BenchmarkProgress
  ) => void,
  shouldStop?: () => boolean
): Promise<BenchmarkResult> {
  const range = validateBenchmarkRange(
    startInput,
    endInput
  );

  const normalizedTarget =
    targetHash.trim().toLowerCase();

  if (
    !/^[0-9a-f]{64}$/.test(
      normalizedTarget
    )
  ) {
    throw new Error(
      "Synthetic match token must be a 64-character hexadecimal SHA-256 value."
    );
  }

  const total = Number(range.total);

  let checked = 0;

  const started = performance.now();
  let lastUpdate = started;

  for (
    let candidate = range.start;
    candidate <= range.end;
    candidate++
  ) {
    if (shouldStop?.()) {
      const elapsed =
        performance.now() - started;

      return {
        found: false,
        candidatesChecked: checked,
        elapsedMs: elapsed,
        candidatesPerSecond:
          checked / Math.max(elapsed / 1000, 0.001)
      };
    }

    const candidateHash =
      await hashCandidate(candidate);

    checked++;

    if (
      candidateHash ===
      normalizedTarget
    ) {
      const elapsed =
        performance.now() - started;

      return {
        found: true,
        candidate: candidate
          .toString(16)
          .padStart(64, "0"),
        matchToken: candidateHash,
        candidatesChecked: checked,
        elapsedMs: elapsed,
        candidatesPerSecond:
          checked /
          Math.max(elapsed / 1000, 0.001)
      };
    }

    const now = performance.now();

    if (
      checked === 1 ||
      checked % 250 === 0 ||
      now - lastUpdate >= 100
    ) {
      lastUpdate = now;

      const elapsed =
        now - started;

      onProgress?.({
        checked,
        total,
        percentage:
          (checked / total) * 100,
        currentCandidate: candidate
          .toString(16)
          .padStart(64, "0"),
        candidatesPerSecond:
          checked /
          Math.max(elapsed / 1000, 0.001),
        elapsedMs: elapsed
      });

      await yieldToBrowser();
    }
  }

  const elapsed =
    performance.now() - started;

  return {
    found: false,
    candidatesChecked: checked,
    elapsedMs: elapsed,
    candidatesPerSecond:
      checked /
      Math.max(elapsed / 1000, 0.001)
  };
}
