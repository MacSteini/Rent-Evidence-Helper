export const inputLimits = {
  postcodeMaxLength: 8,
  rentMin: 1,
  rentMax: 50_000,
  bedroomMin: 0,
  bedroomMax: 10,
  bathroomMin: 0,
  bathroomMax: 10,
  submitCooldownMs: 1_200,
  submitWindowMs: 60_000,
  submitMaxAttempts: 8,
  submitLockoutMs: 15_000,
  dateMin: "1900-01-01",
  dateMax: "2100-12-31"
} as const;

export type SubmitGuardState = {
  timestamps: number[];
  lockedUntil: number;
};

export type SubmitGuardResult = {
  allowed: boolean;
  state: SubmitGuardState;
  message: string | null;
};

export const initialSubmitGuardState: SubmitGuardState = {
  timestamps: [],
  lockedUntil: 0
};

export function sanitisePostcodeInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trimStart()
    .replace(/\s+/g, " ")
    .slice(0, inputLimits.postcodeMaxLength);
}

export function sanitiseRentAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...decimalParts] = cleaned.split(".");
  const decimals = decimalParts.join("").slice(0, 2);

  if (decimalParts.length === 0) return whole.slice(0, 7);

  return `${whole.slice(0, 7)}.${decimals}`;
}

export function parseRentAmountInput(value: string): number {
  if (value.trim() === "" || value === ".") return Number.NaN;
  return Number(value);
}

export function evaluateSubmitAttempt(
  state: SubmitGuardState,
  now = Date.now()
): SubmitGuardResult {
  if (now < state.lockedUntil) {
    return {
      allowed: false,
      state,
      message: `Too many checks were started quickly. Try again in ${secondsUntil(
        state.lockedUntil,
        now
      )} seconds.`
    };
  }

  const recentTimestamps = state.timestamps.filter(
    (timestamp) => now - timestamp < inputLimits.submitWindowMs
  );
  const previousTimestamp = recentTimestamps[recentTimestamps.length - 1];
  const nextTimestamps = [...recentTimestamps, now];

  if (nextTimestamps.length > inputLimits.submitMaxAttempts) {
    const lockedUntil = now + inputLimits.submitLockoutMs;
    return {
      allowed: false,
      state: {
        timestamps: nextTimestamps,
        lockedUntil
      },
      message: `Too many checks were started quickly. Try again in ${secondsUntil(
        lockedUntil,
        now
      )} seconds.`
    };
  }

  if (
    previousTimestamp !== undefined &&
    now - previousTimestamp < inputLimits.submitCooldownMs
  ) {
    return {
      allowed: false,
      state: {
        timestamps: nextTimestamps,
        lockedUntil: 0
      },
      message: "Please wait a moment before starting another check."
    };
  }

  return {
    allowed: true,
    state: {
      timestamps: nextTimestamps,
      lockedUntil: 0
    },
    message: null
  };
}

function secondsUntil(target: number, now: number): number {
  return Math.max(1, Math.ceil((target - now) / 1_000));
}
