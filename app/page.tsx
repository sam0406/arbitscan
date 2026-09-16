"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import targetData from "@/data/test-target.json";

import {
  MAX_BENCHMARK_CANDIDATES,
  validateRange
} from "@/lib/benchmark";

type Status =
  | "idle"
  | "running"
  | "found"
  | "complete"
  | "stopped"
  | "error";

type WorkerResponse =
  | {
      type: "progress";
      checked: number;
      percentage: number;
      elapsedMs: number;
      candidatesPerSecond: number;
    }
  | {
      type: "found";
      checked: number;
      percentage: number;
      elapsedMs: number;
      candidatesPerSecond: number;
    }
  | {
      type: "complete";
      checked: number;
      elapsedMs: number;
      candidatesPerSecond: number;
    }
  | {
      type: "stopped";
      checked: number;
      elapsedMs: number;
    }
  | {
      type: "error";
      message: string;
    };

export default function Home() {
  const workerRef =
    useRef<Worker | null>(null);

  const [status, setStatus] =
    useState<Status>("idle");

  const [progress, setProgress] =
    useState(0);

  const [checked, setChecked] =
    useState(0);

  const [speed, setSpeed] =
    useState(0);

  const [elapsed, setElapsed] =
    useState(0);

  const [position, setPosition] =
    useState<string>("");

  const [error, setError] =
    useState("");

  const range =
    targetData.range;

  const target =
    targetData.target;

  const rangeInfo = useMemo(() => {
    try {
      const info =
        validateRange(
          range.start,
          range.end
        );

      const total =
        info.total;

      const power =
        total > 0n &&
        (total &
          (total - 1n)) === 0n
          ? total.toString(2)
              .length - 1
          : null;

      return {
        valid: true,
        total,
        power
      };
    } catch {
      return {
        valid: false,
        total: 0n,
        power: null
      };
    }
  }, [
    range.start,
    range.end
  ]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  function startCalculation() {
    if (status === "running") {
      return;
    }

    if (!rangeInfo.valid) {
      setStatus("error");
      setError(
        "Invalid calculation range."
      );
      return;
    }

    if (
      rangeInfo.total >
      BigInt(
        MAX_BENCHMARK_CANDIDATES
      )
    ) {
      setStatus("error");
      setError(
        `The selected range contains ${rangeInfo.total.toLocaleString(
          "en-US"
        )} candidates. The current synthetic benchmark limit is ${MAX_BENCHMARK_CANDIDATES.toLocaleString(
          "en-US"
        )}.`
      );
      return;
    }

    if (
      !target.targetHash ||
      !/^[0-9a-f]{64}$/i.test(
        target.targetHash
      )
    ) {
      setStatus("error");
      setError(
        "The synthetic benchmark target has not been generated yet."
      );
      return;
    }

    workerRef.current?.terminate();

    const worker =
      new Worker(
        new URL(
          "../workers/benchmark.worker.ts",
          import.meta.url
        )
      );

    workerRef.current =
      worker;

    setStatus("running");
    setProgress(0);
    setChecked(0);
    setSpeed(0);
    setElapsed(0);
    setPosition("");
    setError("");

    worker.onmessage = (
      event: MessageEvent<WorkerResponse>
    ) => {
      const message =
        event.data;

      if (
        message.type ===
        "progress"
      ) {
        setChecked(
          message.checked
        );

        setProgress(
          message.percentage
        );

        setSpeed(
          message.candidatesPerSecond
        );

        setElapsed(
          message.elapsedMs
        );

        return;
      }

      if (
        message.type === "found"
      ) {
        setStatus("found");

        setChecked(
          message.checked
        );

        setProgress(100);

        setSpeed(
          message.candidatesPerSecond
        );

        setElapsed(
          message.elapsedMs
        );

        setPosition(
          `${message.percentage.toFixed(
            10
          )}%`
        );

        worker.terminate();

        return;
      }

      if (
        message.type ===
        "complete"
      ) {
        setStatus("complete");

        setChecked(
          message.checked
        );

        setProgress(100);

        setSpeed(
          message.candidatesPerSecond
        );

        setElapsed(
          message.elapsedMs
        );

        worker.terminate();

        return;
      }

      if (
        message.type ===
        "stopped"
      ) {
        setStatus("stopped");

        setChecked(
          message.checked
        );

        setElapsed(
          message.elapsedMs
        );

        worker.terminate();

        return;
      }

      if (
        message.type === "error"
      ) {
        setStatus("error");

        setError(
          message.message
        );

        worker.terminate();
      }
    };

    worker.onerror = () => {
      setStatus("error");

      setError(
        "Benchmark worker failed."
      );

      worker.terminate();
    };

    worker.postMessage({
      type: "start",
      start: range.start,
      end: range.end,
      target:
        target.targetHash
    });
  }

  function stopCalculation() {
    workerRef.current?.postMessage({
      type: "stop"
    });

    setStatus("stopped");
  }

  function reset() {
    workerRef.current?.terminate();

    workerRef.current =
      null;

    setStatus("idle");
    setProgress(0);
    setChecked(0);
    setSpeed(0);
    setElapsed(0);
    setPosition("");
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
              Cryptographic Benchmark
            </h1>

            <p className="subtitle">
              Web Worker powered bounded
              synthetic calculation.
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

            {status === "complete" &&
              "COMPLETE"}

            {status === "stopped" &&
              "STOPPED"}

            {status === "error" &&
              "ERROR"}
          </div>
        </header>

        <section className="card">
          <h2>
            Target
          </h2>

          <div className="grid">

            <div className="field">
              <label>
                Range Start
              </label>

              <input
                value={
                  range.start
                }
                readOnly
              />
            </div>

            <div className="field">
              <label>
                Range End
              </label>

              <input
                value={
                  range.end
                }
                readOnly
              />
            </div>

          </div>

          <div className="field">
            <label>
              Public Key
            </label>

            <input
              value={
                target.publicKey
              }
              readOnly
            />
          </div>

          <div className="field">
            <label>
              BTC Address
            </label>

            <input
              value={
                target.btcAddress
              }
              readOnly
            />
          </div>

          <div className="notice">
            The discovered candidate is
            never displayed. Only its
            calculated position is reported.
          </div>
        </section>

        <section className="card">

          <div className="range-info">

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
                Range Power
              </span>

              <strong>
                {rangeInfo.power !== null
                  ? `2^${rangeInfo.power}`
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
                width:
                  `${Math.min(
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
                {formatNumber(
                  checked
                )}
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
                  Math.round(
                    speed
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Elapsed
              </span>

              <strong>
                {(
                  elapsed / 1000
                ).toFixed(3)}
                s
              </strong>
            </div>

            <div>
              <span>
                Position
              </span>

              <strong>
                {position ||
                  "—"}
              </strong>
            </div>

          </div>

          <div className="actions">

            <button
              onClick={
                startCalculation
              }
              disabled={
                status ===
                "running"
              }
            >
              {status === "running"
                ? "Calculating..."
                : "Start Calculation"}
            </button>

            <button
              className="secondary"
              onClick={
                stopCalculation
              }
              disabled={
                status !==
                "running"
              }
            >
              Stop
            </button>

            <button
              className="secondary"
              onClick={
                reset
              }
              disabled={
                status ===
                "running"
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
                  Position In Range
                </span>

                <strong>
                  {position}
                </strong>
              </div>

              <div>
                <span>
                  Candidates Checked
                </span>

                <strong>
                  {formatNumber(
                    checked
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
                      speed
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
                    elapsed /
                    1000
                  ).toFixed(3)}
                  s
                </strong>
              </div>

            </div>

          </section>
        )}

        {status === "complete" && (
          <section className="card">
            <h2>
              Benchmark Complete
            </h2>

            <p>
              The entire configured
              synthetic benchmark range
              was processed without a
              matching target.
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
