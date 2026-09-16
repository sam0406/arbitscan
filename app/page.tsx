"use client";

import { useMemo, useState } from "react";

import targetData from "@/data/test-target.json";

import {
  MAX_BENCHMARK_CANDIDATES,
  runBenchmark,
  validateRange
} from "@/lib/benchmark";

import { positionInRange } from "@/lib/position";

type Status =
  | "idle"
  | "running"
  | "found"
  | "not-found"
  | "stopped"
  | "error";

export default function Home() {
  const [status, setStatus] =
    useState<Status>("idle");

  const [progress, setProgress] =
    useState(0);

  const [checked, setChecked] =
    useState(0);

  const [currentCandidate, setCurrentCandidate] =
    useState("");

  const [speed, setSpeed] =
    useState(0);

  const [elapsed, setElapsed] =
    useState(0);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<{
      candidate?: string;
      matchToken?: string;
      offset?: string;
      total?: string;
      percentage?: string;
      candidatesChecked?: number;
      elapsedMs?: number;
      candidatesPerSecond?: number;
    }>({});

  const range = targetData.range;
  const target = targetData.target;

  const rangeInfo = useMemo(() => {
    try {
      const info = validateRange(
        range.start,
        range.end
      );

      const total = info.total;

      const isPowerOfTwo =
        total > 0n &&
        (total & (total - 1n)) === 0n;

      const exponent = isPowerOfTwo
        ? total.toString(2).length - 1
        : null;

      return {
        valid: true,
        total,
        exponent
      };
    } catch {
      return {
        valid: false,
        total: 0n,
        exponent: null
      };
    }
  }, [range.start, range.end]);

  async function startCalculation() {
    if (status === "running") {
      return;
    }

    setStatus("running");
    setProgress(0);
    setChecked(0);
    setCurrentCandidate("");
    setSpeed(0);
    setElapsed(0);
    setResult({});
    setError("");

    try {
      const response =
        await runBenchmark(
          range.start,
          range.end,
          target.matchToken,
          (update) => {
            setChecked(update.checked);
            setProgress(update.percentage);
            setCurrentCandidate(
              update.currentCandidate
            );
            setSpeed(
              update.candidatesPerSecond
            );
            setElapsed(update.elapsedMs);
          }
        );

      setChecked(
        response.candidatesChecked
      );

      setSpeed(
        response.candidatesPerSecond
      );

      setElapsed(
        response.elapsedMs
      );

      if (
        !response.found ||
        !response.candidate
      ) {
        setStatus("not-found");

        setProgress(
          rangeInfo.total > 0n
            ? (BigInt(
                response.candidatesChecked
              ) *
                100) /
                rangeInfo.total >
              100n
              ? 100
              : Number(
                  (BigInt(
                    response.candidatesChecked
                  ) *
                    1000000n) /
                    rangeInfo.total
                ) / 10000
            : 0
        );

        return;
      }

      const position =
        positionInRange(
          range.start,
          range.end,
          response.candidate
        );

      setProgress(100);
      setCurrentCandidate(
        response.candidate
      );

      setResult({
        candidate:
          response.candidate,

        matchToken:
          response.matchToken,

        offset:
          position.offset,

        total:
          position.total,

        percentage:
          position.percentageFormatted,

        candidatesChecked:
          response.candidatesChecked,

        elapsedMs:
          response.elapsedMs,

        candidatesPerSecond:
          response.candidatesPerSecond
      });

      setStatus("found");
    } catch (err) {
      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Calculation failed."
      );
    }
  }

  function reset() {
    setStatus("idle");
    setProgress(0);
    setChecked(0);
    setCurrentCandidate("");
    setSpeed(0);
    setElapsed(0);
    setResult({});
    setError("");
  }

  function formatNumber(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-US"
    ).format(value);
  }

  return (
    <main className="page">
      <section className="container">

        <header className="header">
          <div>
            <div className="eyebrow">
              ARBITSCAN
            </div>

            <h1>
              Synthetic Cryptographic
              Benchmark
            </h1>

            <p className="subtitle">
              Deterministic bounded-range
              calculation with live progress,
              matching and exact range
              positioning.
            </p>
          </div>

          <div
            className={`status status-${status}`}
          >
            {status === "idle" &&
              "READY"}

            {status === "running" &&
              "RUNNING"}

            {status === "found" &&
              "MATCH FOUND"}

            {status === "not-found" &&
              "NO MATCH"}

            {status === "stopped" &&
              "STOPPED"}

            {status === "error" &&
              "ERROR"}
          </div>
        </header>

        <section className="card">
          <h2>
            Target Configuration
          </h2>

          <div className="grid">

            <div className="field">
              <label>
                Range Start
              </label>

              <input
                value={range.start}
                readOnly
              />
            </div>

            <div className="field">
              <label>
                Range End
              </label>

              <input
                value={range.end}
                readOnly
              />
            </div>

          </div>

          <div className="field">
            <label>
              Synthetic Public Key
            </label>

            <input
              value={target.publicKey}
              readOnly
            />
          </div>

          <div className="field">
            <label>
              Synthetic BTC Address
            </label>

            <input
              value={target.btcAddress}
              readOnly
            />
          </div>

          <div className="field">
            <label>
              Synthetic Match Token
            </label>

            <input
              value={target.matchToken}
              readOnly
            />
          </div>

          <div className="notice">
            The public key and address are
            target metadata. The private test
            scalar is not stored in ArbiScan.
          </div>
        </section>

        <section className="card">

          <div className="range-info">

            <div>
              <span>
                Range Size
              </span>

              <strong>
                {rangeInfo.valid
                  ? rangeInfo.total.toLocaleString(
                      "en-US"
                    )
                  : "Invalid"}
              </strong>
            </div>

            <div>
              <span>
                Range Power
              </span>

              <strong>
                {rangeInfo.exponent !== null
                  ? `2^${rangeInfo.exponent}`
                  : "Non power-of-two"}
              </strong>
            </div>

          </div>

          <div className="progress-header">
            <h2>
              Calculation
            </h2>

            <strong>
              {progress.toFixed(4)}%
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(
                  progress,
                  100
                )}%`
              }}
            />
          </div>

          <div className="stats">

            <div>
              <span>
                Checked
              </span>

              <strong>
                {formatNumber(checked)}
              </strong>
            </div>

            <div>
              <span>
                Range Size
              </span>

              <strong>
                {rangeInfo.total.toLocaleString(
                  "en-US"
                )}
              </strong>
            </div>

            <div>
              <span>
                Benchmark Limit
              </span>

              <strong>
                {formatNumber(
                  MAX_BENCHMARK_CANDIDATES
                )}
              </strong>
            </div>

          </div>

          <div className="stats">

            <div>
              <span>
                Candidates / Second
              </span>

              <strong>
                {formatNumber(
                  Math.round(speed)
                )}
              </strong>
            </div>

            <div>
              <span>
                Elapsed
              </span>

              <strong>
                {(elapsed / 1000).toFixed(
                  3
                )}s
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {status.toUpperCase()}
              </strong>
            </div>

          </div>

          <div className="candidate">

            <span>
              Current Candidate
            </span>

            <code>
              {currentCandidate ||
                "Waiting to start..."}
            </code>

          </div>

          <div className="actions">

            <button
              onClick={
                startCalculation
              }
              disabled={
                status === "running"
              }
            >
              {status === "running"
                ? "Calculating..."
                : "Start Calculation"}
            </button>

            <button
              className="secondary"
              onClick={reset}
              disabled={
                status === "running"
              }
            >
              Reset
            </button>

          </div>

        </section>

        {status === "found" && (
          <section className="card result-card">

            <h2>
              Match Found
            </h2>

            <div className="result-grid">

              <div>
                <span>
                  Discovered Candidate
                </span>

                <code>
                  {result.candidate}
                </code>
              </div>

              <div>
                <span>
                  Match Token
                </span>

                <code>
                  {result.matchToken}
                </code>
              </div>

              <div>
                <span>
                  Offset From Start
                </span>

                <strong>
                  {result.offset}
                </strong>
              </div>

              <div>
                <span>
                  Total Candidates
                </span>

                <strong>
                  {result.total}
                </strong>
              </div>

              <div>
                <span>
                  Position In Range
                </span>

                <strong>
                  {result.percentage}
                </strong>
              </div>

              <div>
                <span>
                  Candidates Checked
                </span>

                <strong>
                  {formatNumber(
                    result.candidatesChecked ||
                      0
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Speed
                </span>

                <strong>
                  {formatNumber(
                    Math.round(
                      result.candidatesPerSecond ||
                        0
                    )
                  )}{" "}
                  / sec
                </strong>
              </div>

              <div>
                <span>
                  Elapsed
                </span>

                <strong>
                  {(
                    (result.elapsedMs ||
                      0) / 1000
                  ).toFixed(3)}
                  s
                </strong>
              </div>

            </div>

          </section>
        )}

        {status === "not-found" && (
          <section className="card">

            <h2>
              No Match
            </h2>

            <p>
              No matching synthetic candidate
              was found in the configured
              executable benchmark range.
            </p>

          </section>
        )}

        {status === "error" && (
          <section className="card error-card">

            <h2>
              Calculation Error
            </h2>

            <p>
              {error}
            </p>

          </section>
        )}

      </section>
    </main>
  );
}
