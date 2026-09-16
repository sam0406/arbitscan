import { createHash } from "crypto";
import { parseHex } from "./position";

export const MAX_BENCHMARK_CANDIDATES = 22_307_074_000_000_000_000_000_000_000_000_000_000;

export type BenchmarkTarget = {
  publicKey: string;
  btcAddress: string;
  candidateHash: string;
};

export type BenchmarkResult = {
  found: boolean;
  candidate?: string;
  candidateHash?: string;
  candidatesChecked: number;
  elapsedMs: number;
};

function sha256(value: string): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

/**
 * Deterministic synthetic cryptographic target.
 *
 * This deliberately does NOT derive a Bitcoin public key/address.
 * It gives ArbiScan a genuine cryptographic comparison target
 * without turning the application into a Bitcoin private-key
 * recovery engine.
 */
export function hashCandidate(candidate: bigint): string {
  return sha256(candidate.toString(16).padStart(64, "0"));
}

export function validateBenchmarkRange(
  startInput: string,
  endInput: string
) {
  const start = parseHex(startInput);
  const end = parseHex(endInput);

  if (start > end) {
    throw new Error("Range start is greater than range end.");
  }

  const total = end - start + 1n;

  if (total > BigInt(MAX_BENCHMARK_CANDIDATES)) {
    throw new Error(
      `Synthetic benchmark is limited to ${MAX_BENCHMARK_CANDIDATES.toLocaleString()} candidates.`
    );
  }

  return {
    start,
    end,
    total
  };
}

export async function runBenchmark(
  startInput: string,
  endInput: string,
  targetHash: string,
  onProgress?: (
    checked: number,
    total: number,
    currentCandidate: string
  ) => void,
  shouldStop?: () => boolean
): Promise<BenchmarkResult> {
  const { start, end, total } =
    validateBenchmarkRange(startInput, endInput);

  const normalizedTarget = targetHash
    .trim()
    .toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalizedTarget)) {
    throw new Error(
      "Target hash must be a 64-character hexadecimal SHA-256 value."
    );
  }

  const totalNumber = Number(total);
  let checked = 0;

  const started = performance.now();

  for (
    let candidate = start;
    candidate <= end;
    candidate++
  ) {
    if (shouldStop?.()) {
      return {
        found: false,
        candidatesChecked: checked,
        elapsedMs: performance.now() - started
      };
    }

    const candidateHash = hashCandidate(candidate);

    checked++;

    if (candidateHash === normalizedTarget) {
      return {
        found: true,
        candidate: candidate
          .toString(16)
          .padStart(64, "0"),
        candidateHash,
        candidatesChecked: checked,
        elapsedMs: performance.now() - started
      };
    }

    if (
      checked === 1 ||
      checked % 1000 === 0 ||
      checked === totalNumber
    ) {
      onProgress?.(
        checked,
        totalNumber,
        candidate
          .toString(16)
          .padStart(64, "0")
      );

      await new Promise<void>((resolve) =>
        setTimeout(resolve, 0)
      );
    }
  }

  return {
    found: false,
    candidatesChecked: checked,
    elapsedMs: performance.now() - started
  };
}
