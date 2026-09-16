import {
  validateBenchmarkRange
} from "../lib/benchmark";

type StartMessage = {
  type: "start";
  start: string;
  end: string;
  target: string;
};

type StopMessage = {
  type: "stop";
};

type WorkerMessage =
  | StartMessage
  | StopMessage;

let stopped = false;

function toHex(value: bigint): string {
  return value
    .toString(16)
    .padStart(64, "0");
}

async function sha256(
  input: string
): Promise<string> {
  const data =
    new TextEncoder().encode(input);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map((x) =>
      x.toString(16).padStart(2, "0")
    )
    .join("");
}

/*
 * Synthetic cryptographic operation.
 *
 * Each candidate is transformed into a
 * fixed-width scalar representation and
 * processed with SHA-256.
 *
 * This is deliberately not a Bitcoin
 * private-key/public-key recovery operation.
 */
async function calculateCandidate(
  candidate: bigint
): Promise<string> {
  return sha256(
    toHex(candidate)
  );
}

self.onmessage = async (
  event: MessageEvent<WorkerMessage>
) => {
  const message = event.data;

  if (message.type === "stop") {
    stopped = true;
    return;
  }

  if (message.type !== "start") {
    return;
  }

  stopped = false;

  try {
    const range =
      validateBenchmarkRange(
        message.start,
        message.end
      );

    const target =
      message.target
        .trim()
        .toLowerCase();

    if (
      !/^[0-9a-f]{64}$/.test(target)
    ) {
      throw new Error(
        "Invalid synthetic target."
      );
    }

    const total =
      Number(range.total);

    let checked = 0;

    const started =
      performance.now();

    let lastUpdate =
      started;

    for (
      let candidate = range.start;
      candidate <= range.end;
      candidate++
    ) {
      if (stopped) {
        self.postMessage({
          type: "stopped",
          checked,
          elapsedMs:
            performance.now() -
            started
        });

        return;
      }

      const digest =
        await calculateCandidate(
          candidate
        );

      checked++;

      /*
       * Do not send the candidate back
       * to the UI.
       *
       * Only send the position percentage.
       */
      if (digest === target) {
        const offset =
          candidate -
          range.start;

        const span =
          range.end -
          range.start;

        const percentage =
          span === 0n
            ? 0
            : Number(
                (offset *
                  1000000000000n) /
                  span
              ) /
              10000000000;

        const elapsed =
          performance.now() -
          started;

        self.postMessage({
          type: "found",
          percentage,
          checked,
          elapsedMs: elapsed,
          candidatesPerSecond:
            checked /
            Math.max(
              elapsed / 1000,
              0.001
            )
        });

        return;
      }

      const now =
        performance.now();

      if (
        checked === 1 ||
        checked % 250 === 0 ||
        now - lastUpdate >= 100
      ) {
        lastUpdate = now;

        const elapsed =
          now - started;

        const offset =
          candidate -
          range.start;

        const percentage =
          Number(
            (offset *
              1000000000000n) /
              (range.end -
                range.start)
          ) /
          10000000000;

        self.postMessage({
          type: "progress",
          checked,
          percentage,
          elapsedMs: elapsed,
          candidatesPerSecond:
            checked /
            Math.max(
              elapsed / 1000,
              0.001
            )
        });
      }
    }

    const elapsed =
      performance.now() -
      started;

    self.postMessage({
      type: "complete",
      checked,
      elapsedMs: elapsed,
      candidatesPerSecond:
        checked /
        Math.max(
          elapsed / 1000,
          0.001
        )
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Worker calculation failed."
    });
  }
};
