export type PostcodeParts = {
  normalised: string;
  outwardCode: string;
  sector: string;
};

const UK_POSTCODE_PATTERN =
  /^([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})$/i;

export function normalisePostcode(postcode: string): string {
  const compact = postcode.trim().toUpperCase().replace(/\s+/g, "");
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function parsePostcode(postcode: string): PostcodeParts | null {
  const normalised = normalisePostcode(postcode);
  const match = normalised.match(UK_POSTCODE_PATTERN);
  if (!match) return null;

  const outwardCode = match[1].toUpperCase();
  const inwardCode = match[2].toUpperCase();
  const sector = `${outwardCode} ${inwardCode[0]}`;

  return { normalised, outwardCode, sector };
}

export function isValidPostcode(postcode: string): boolean {
  return parsePostcode(postcode) !== null;
}
