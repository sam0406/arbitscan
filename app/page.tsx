"use client";

import { useState } from "react";

type Status =
  | "idle"
  | "running"
  | "found"
  | "complete"
  | "error";

export default function Home() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");

  const [status, setStatus] =
    useState<Status>("idle");

  const [progress, setProgress] =
    useState(0);

  const [checked, setChecked] =
    useState("0");

  const [current, setCurrent] =
    useState("");

  const [result, setResult] =
    useState<{
      key: string;
      position: string;
      percentage: string;
    } | null>(null);

  const [error, setError] =
    useState("");

  async function runCalculation() {
    setError("");
    setResult(null);
    setProgress(0);
    setChecked("0");
    setCurrent("");
    setStatus("running");

    /*
     * The production-safe version deliberately does not
     * implement arbitrary Bitcoin private-key recovery.
     *
     * This is where the bounded synthetic cryptographic
     * benchmark/search engine can be connected.
     */

    try {
      if (!start.trim()) {
        throw new Error(
          "Range start is required."
        );
      }

      if (!end.trim()) {
        throw new Error(
          "Range end is required."
        );
      }

      if (!publicKey.trim()) {
        throw new Error(
          "Public key is required."
        );
      }

      if (!address.trim()) {
        throw new Error(
          "Address is required."
        );
      }

      const startValue = BigInt(
        `0x${start
          .replace(/^0x/i, "")
          .trim()}`
      );

      const endValue = BigInt(
        `0x${end
          .replace(/^0x/i, "")
          .trim()}`
      );

      if (startValue > endValue) {
        throw new Error(
          "Range start must not exceed range end."
        );
      }

      /*
       * Safety bound for the local benchmark.
       *
       * This keeps the demonstration a deliberately
       * small bounded calculation.
       */
      const span =
        endValue - startValue + 1n;

      if (span > 100000n) {
        throw new Error(
          "Test calculation is limited to 100,000 candidates."
        );
      }

      /*
       * Real progress simulation for the bounded
       * benchmark pipeline. Replace this section with
       * the permitted synthetic cryptographic target
       * calculation.
       */

      const total =
        Number(span);

      for (
        let i = 0;
        i < total;
        i++
      ) {
        const candidate =
          startValue +
          BigInt(i);

        setCurrent(
          candidate.toString(16)
        );

        setChecked(
          (i + 1).toString()
        );

        setProgress(
          ((i + 1) / total) * 100
        );

        await new Promise(
          resolve =>
            setTimeout(resolve, 2)
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

  function reset() {
    setStatus("idle");
    setProgress(0);
    setChecked("0");
    setCurrent("");
    setResult(null);
    setError("");
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

              <div className="subtitle">
                Cryptographic range analyzer
              </div>
            </div>
          </div>
        </header>

        <section className="card">

          <h2>
            Target Configuration
          </h2>

          <div className="field">
            <label>
              Range Start — HEX
            </label>

            <input
              value={start}
              onChange={e =>
                setStart(e.target.value)
              }
              placeholder="100"
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label>
              Range End — HEX
            </label>

            <input
              value={end}
              onChange={e =>
                setEnd(e.target.value)
              }
              placeholder="1ff"
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label>
              Target Public Key
            </label>

            <input
              value={publicKey}
              onChange={e =>
                setPublicKey(e.target.value)
              }
              placeholder="02..."
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label>
              Target Address
            </label>

            <input
              value={address}
              onChange={e =>
                setAddress(e.target.value)
              }
              placeholder="1..."
              spellCheck={false}
            />
          </div>

          <div className="actions">

            <button
              onClick={runCalculation}
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
                Candidates checked
              </span>

              <span>
                {checked}
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
                Progress
              </span>

              <span>
                {progress.toFixed(2)}%
              </span>
            </div>

            {current && (
              <div className="current">
                Current candidate: 0x
                {current}
              </div>
            )}

          </div>

        </section>

        {result && (
          <section className="card result">

            <h2>
              Match Found
            </h2>

            <div className="percent">
              {result.percentage}
            </div>

            <div className="stats">

              <div className="stat">
                <div className="statLabel">
                  Private Key
                </div>

                <div className="statValue">
                  0x{result.key}
                </div>
              </div>

              <div className="stat">
                <div className="statLabel">
                  Position
                </div>

                <div className="statValue">
                  {result.position}
                </div>
              </div>

              <div className="stat">
                <div className="statLabel">
                  Status
                </div>

                <div className="statValue">
                  VERIFIED MATCH
                </div>
              </div>

            </div>

          </section>
        )}

        <section className="card">
          <p className="note">
            ArbitScan uses arbitrary-precision integer
            arithmetic for range calculations. The
            public-key/address fields are target
            reference fields; this version does not
            implement arbitrary Bitcoin private-key
            recovery.
          </p>
        </section>

      </div>
    </main>
  );
}
