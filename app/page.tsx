"use client";

import { useMemo, useState } from "react";
import targetData from "@/data/test-target.json";
import {
  runBenchmark,
  validateBenchmarkRange,
  MAX_BENCHMARK_CANDIDATES
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

  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(0);
  const [currentCandidate, setCurrentCandidate] =
    useState("");

  const [result, setResult] = useState<{
    candidate?: string;
    candidateHash?: string;
    offset?: string;
    total?: string;
    percentage?: string;
    candidatesChecked?: number;
    elapsedMs?: number;
  }>({});

  const [error, setError] = useState("");

  const range = targetData.range;
  const target = targetData.target;

  const rangeInfo = useMemo(() => {
    try {
      const info = validateBenchmarkRange(
        range.start,
        range.end
      );

      return {
        total: info.total.toString(),
        valid: true
      };
    } catch {
      return {
        total: "0",
        valid: false
      };
    }
  }, []);

  async function startCalculation() {
    if (status === "running") {
      return;
    }

    setStatus("running");
    setProgress(0);
    setChecked(0);
    setCurrentCandidate("");
    setResult({});
    setError("");

    try {
      const response = await runBenchmark(
        range.start,
        range.end,
        target.candidateHash,
        (
          checkedCount,
          totalCount,
          candidate
        ) => {
          setChecked(checkedCount);
          setCurrentCandidate(candidate);

          const percentage =
            (checkedCount / totalCount) * 100;

          setProgress(percentage);
        }
      );

      setChecked(response.candidatesChecked);

      if (!response.found || !response.candidate) {
        setProgress(
          response.candidatesChecked /
            Number(rangeInfo.total) *
            100
        );

        setStatus("not-found");

        setResult({
          candidatesChecked:
            response.candidatesChecked,
          elapsedMs: response.elapsedMs
        });

        return;
      }

      const position = positionInRange(
        range.start,
        range.end,
        response.candidate
      );

      setProgress(100);
      setCurrentCandidate(response.candidate);

      setResult({
        candidate: response.candidate,
        candidateHash:
          response.candidateHash,
        offset: position.offset,
        total: position.total,
        percentage:
          position.percentageFormatted,
        candidatesChecked:
          response.candidatesChecked,
        elapsedMs:
          response.elapsedMs
      });

      setStatus("found");
    } catch (err) {
      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Unknown calculation error."
      );
    }
  }

  function reset() {
    setStatus("idle");
    setProgress(0);
    setChecked(0);
    setCurrentCandidate("");
    setResult({});
    setError("");
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat(
      "en-US"
    ).format(value);
  }

  return (
    <main className="page">
      <section className="container">
        <div className="header">
          <div>
            <div className="eyebrow">
              ARBITSCAN
            </div>

            <h1>
              Synthetic Cryptographic Benchmark
            </h1>

            <p className="subtitle">
              Bounded deterministic range search
              with live progress and exact
              position reporting.
            </p>
          </div>

          <div
            className={`status status-${status}`}
          >
            {status === "idle" && "READY"}
            {status === "running" && "RUNNING"}
            {status === "found" && "MATCH FOUND"}
            {status === "not-found" &&
              "NO MATCH"}
            {status === "stopped" &&
              "STOPPED"}
            {status === "error" && "ERROR"}
          </div>
        </div>

        <section className="card">
          <h2>Benchmark Input</h2>

          <div className="grid">
            <div className="field">
              <label>Range Start</label>
              <input
                value={range.start}
                readOnly
              />
            </div>

            <div className="field">
              <label>Range End</label>
              <input
                value={range.end}
                readOnly
              />
            </div>
          </div>

          <div className="field">
            <label>Synthetic Public Key</label>
            <input
              value={target.publicKey}
              readOnly
            />
          </div>

          <div className="field">
            <label>BTC Address Field</label>
            <input
              value={target.btcAddress}
              readOnly
            />
          </div>

          <div className="field">
            <label>Target Cryptographic Hash</label>
            <input
              value={target.candidateHash}
              readOnly
            />
          </div>

          <div className="notice">
            Synthetic benchmark only. The
            private test scalar is not stored
            in this application.
          </div>
        </section>

        <section className="card">
          <div className="progress-header">
            <h2>Calculation</h2>

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
              <span>Checked</span>
              <strong>
                {formatNumber(checked)}
              </strong>
            </div>

            <div>
              <span>Total</span>
              <strong>
                {formatNumber(
                  Number(rangeInfo.total)
                )}
              </strong>
            </div>

            <div>
              <span>Limit</span>
              <strong>
                {formatNumber(
                  MAX_BENCHMARK_CANDIDATES
                )}
              </strong>
            </div>
          </div>

          <div className="candidate">
            <span>Current Candidate</span>

            <code>
              {currentCandidate ||
                "Waiting to start..."}
            </code>
          </div>

          <div className="actions">
            <button
              onClick={startCalculation}
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
            <h2>Match Found</h2>

            <div className="result-grid">
              <div>
                <span>Discovered Candidate</span>
                <code>
                  {result.candidate}
                </code>
              </div>

              <div>
                <span>Candidate Hash</span>
                <code>
                  {result.candidateHash}
                </code>
              </div>

              <div>
                <span>Offset From Start</span>
                <strong>
                  {result.offset}
                </strong>
              </div>

              <div>
                <span>Total Range</span>
                <strong>
                  {result.total}
                </strong>
              </div>

              <div>
                <span>Position</span>
                <strong>
                  {result.percentage}
                </strong>
              </div>

              <div>
                <span>Candidates Checked</span>
                <strong>
                  {formatNumber(
                    result.candidatesChecked ||
                      0
                  )}
                </strong>
              </div>

              <div>
                <span>Elapsed</span>
                <strong>
                  {(
                    (result.elapsedMs || 0) /
                    1000
                  ).toFixed(3)}
                  s
                </strong>
              </div>
            </div>
          </section>
        )}

        {status === "not-found" && (
          <section className="card">
            <h2>No Match</h2>
            <p>
              The supplied target was not found
              within the configured benchmark
              range.
            </p>
          </section>
        )}

        {status === "error" && (
          <section className="card error-card">
            <h2>Calculation Error</h2>
            <p>{error}</p>
          </section>
        )}
      </section>
    </main>
  );
}
