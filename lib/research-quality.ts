import { Grant, Leadership } from "@/types/brief";

export function needsLeadershipRetry(leadership: Leadership[]) {
  return !leadership.some(({ title }) => /^(?:fire\s+)?chief$/i.test(title.trim()));
}

export function needsFundingRetry(grants: Grant[]) {
  return !grants.some(
    ({ amount }) =>
      /\d/.test(amount) && !/not stated|unknown|unavailable|not reported/i.test(amount),
  );
}

export function mergeLeadership(primary: Leadership[], followUp: Leadership[]) {
  const seen = new Set(primary.map(({ name, title }) => `${name}|${title}`.toLowerCase()));
  return [
    ...primary,
    ...followUp.filter(({ name, title }) => {
      const key = `${name}|${title}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
}

export function mergeGrants(primary: Grant[], followUp: Grant[]) {
  const keyFor = ({ organization, program, amount, fiscalYear }: Grant) =>
    `${organization}|${program}|${amount}|${fiscalYear}`.toLowerCase();
  const seen = new Set(primary.map(keyFor));
  return [
    ...primary,
    ...followUp.filter((grant) => {
      const key = keyFor(grant);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
}
