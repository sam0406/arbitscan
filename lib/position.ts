export function parseHex(value: string): bigint {
  const clean = value
    .trim()
    .toLowerCase()
    .replace(/^0x/, "");

  if (!clean) {
    throw new Error("Value is empty.");
  }

  if (!/^[0-9a-f]+$/.test(clean)) {
    throw new Error(`Invalid hexadecimal value: ${value}`);
  }

  return BigInt(`0x${clean}`);
}

export function positionInRange(
  startInput: string,
  endInput: string,
  keyInput: string
) {
  const start = parseHex(startInput);
  const end = parseHex(endInput);
  const key = parseHex(keyInput);

  if (start > end) {
    throw new Error("Range start is greater than range end.");
  }

  if (key < start || key > end) {
    throw new Error("Key is outside the supplied range.");
  }

  const offset = key - start;
  const span = end - start;

  const percentage =
    span === 0n
      ? 0
      : Number(
          (offset * 1000000000000n) / span
        ) / 10000000000;

  return {
    offset: offset.toString(),
    total: (end - start + 1n).toString(),
    percentage,
    percentageFormatted:
      `${percentage.toFixed(10)}%`
  };
}
