"use client";

import { useState } from "react";
import targetData from "@/data/test-target.json";

type Status =
  | "idle"
  | "running"
  | "complete"
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

  const [error, setError] =
    useState("");

  const start =
    targetData.range.start;

  const end =
    targetData.range.end;

  const publicKey =
    targetData.target.publicKey;

  const btcAddress =
    targetData.target.btcAddress;

  function reset() {
    setStatus("idle");
    setProgress(0);
    setChecked(0);
    setCurrentCandidate("");
    setError("");
  }

  async function startCalculation() {
    reset();
    setStatus("running");

    try {
      const startValue = BigInt(
        `0x${start.replace(/^0x/i, "")}`
      );

      const endValue = BigInt(
        `0x${end.replace(/^0x/i, "")}`
      );

      if (startValue > endValue) {
        throw new Error(
          "Range start is greater than range end."
        );
      }

      const total =
        endValue - startValue + 1n;

      /*
       * Safety limit for the synthetic benchmark.
       *
       * The actual cryptographic benchmark will operate
       * against the separately generated synthetic target.
       */
      if (total > 100000n) {
        throw new Error(
          "Synthetic benchmark range cannot exceed 100,000 candidates."
        );
      }

      /*
       * This loop is the progress controller.
       *
       * The actual synthetic cryptographic calculation
       * will be connected here.
       */
      for (
        let i = 0n;
        i < total;
        i++
      ) {
        const candidate =
          startValue + i;

        setCurrentCandidate(
          candidate.toString(16)
        );

        setChecked(
          Number(i + 1n)
        );

        const percentage =
          Number(
            (i + 1n) * 10000n / total
          ) / 100;

        setProgress(
          Math.min(100, percentage)
        );

        /*
         * Yield to the browser so the progress bar
         * remains responsive.
         */
        await new Promise(
          resolve =>
            setTimeout(resolve, 1)
        );
      }

      setStatus("complete");

    } catch (err) {
      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Calculation failed."
      );
    }
  }

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="brand">
            <div className="logo">
              A
            </div>

            <div>
              <h1 className="title">
                ArbitScan
              </h1>

              <p className="subtitle">
                Synthetic cryptographic range analyzer
              </p>
            </div>
          </div>
        </header>

        <section className="card">

          <h2>
            Test Target
          </h2>

          <div className="field">
            <label>
              Range Start
            </label>

            <input
              value={`0x${start}`}
              readOnly
            />
          </div>

          <div className="field">
            <label>
              Range End
            </label>

            <input
              value={`0x${end}`}
              readOnly
            />
          </div>

          <div className="field">
            <label>
              Public Key
            </label>

            <input
              value={publicKey}
              readOnly
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label>
              Bitcoin Address
            </label>

            <input
              value={btcAddress}
              readOnly
              spellCheck={false}
            />
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

          {error && (
            <div className="error">
              {error}
            </div>
          )}

        </section>

        <section className="card">

          <h2>
            Calculation Progress
          </h2>

          <div className="progressBox">

            <div className="progressHeader">
              <span>
                Progress
              </span>

              <span>
                {progress.toFixed(2)}%
              </span>
            </div>

            <div className="progressTrack">
              <div
                className="progressBar"
                style={{
                  width:
                    `${progress}%`
                }}
              />
            </div>

            <div className="progressHeader">
              <span>
                Candidates checked
              </span>

              <span>
                {checked.toLocaleString()}
              </span>
            </div>

            {currentCandidate && (
              <div className="current">
                Current candidate:
                {" "}
                0x{currentCandidate}
              </div>
            )}

          </div>

        </section>

        {status === "complete" && (
          <section className="card result">

            <h2>
              Calculation Complete
            </h2>

            <p className="note">
              The bounded synthetic calculation has
              completed. The cryptographic match result
              will be displayed here once the synthetic
              target-search engine is connected.
            </p>

            <div className="stats">

              <div className="stat">
                <div className="statLabel">
                  Range Start
                </div>

                <div className="statValue">
                  0x{start}
                </div>
              </div>

              <div className="stat">
                <div className="statLabel">
                  Range End
                </div>

                <div className="statValue">
                  0x{end}
                </div>
              </div>

              <div className="stat">
                <div className="statLabel">
                  Candidates
                </div>

                <div className="statValue">
                  {checked.toLocaleString()}
                </div>
              </div>

            </div>

          </section>
        )}

        <section className="card">

          <p className="note">
            Target data is loaded from
            {" "}
            <code>
              data/test-target.json
            </code>
            .
            The private test scalar is not stored in
            ArbitScan.
          </p>

        </section>

      </div>
    </main>
  );
}
