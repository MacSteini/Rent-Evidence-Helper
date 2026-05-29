export function sortNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = sortNumbers(values);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function quantile(values: number[], q: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = sortNumbers(values);
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  const next = sorted[base + 1];
  if (next === undefined) return sorted[base];
  return sorted[base] + rest * (next - sorted[base]);
}

export function lowerQuartile(values: number[]): number | undefined {
  return quantile(values, 0.25);
}

export function upperQuartile(values: number[]): number | undefined {
  return quantile(values, 0.75);
}
