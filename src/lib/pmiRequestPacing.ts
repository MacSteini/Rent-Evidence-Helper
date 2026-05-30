export const pmiFreeTierCooldownMs = 10_000;

export function getPmiCooldownMs(
  lastAttemptAt: number | null,
  now = Date.now()
): number {
  if (lastAttemptAt === null) return 0;
  return Math.max(0, pmiFreeTierCooldownMs - (now - lastAttemptAt));
}

export function getPmiCooldownSeconds(
  lastAttemptAt: number | null,
  now = Date.now()
): number {
  return Math.ceil(getPmiCooldownMs(lastAttemptAt, now) / 1_000);
}

export function buildPmiCooldownMessage(seconds: number): string {
  return `Property Market Intel free tier allows 2 requests per 10 seconds. Wait ${seconds} ${seconds === 1 ? "second" : "seconds"} before running live evidence again.`;
}
