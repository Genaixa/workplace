// £8 first hour, £3 each additional hour, capped at £15 (day pass) for 4+ hours
// Returns amount in pence
export function calculatePrice(hours: number): number {
  if (hours <= 0) return 0;
  if (hours === 1) return 800;
  if (hours === 2) return 1100;
  if (hours === 3) return 1400;
  return 1500; // 4+ hours = day pass
}

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export const PRICE_TABLE = [
  { hours: 1, label: "1 hour", pence: 800 },
  { hours: 2, label: "2 hours", pence: 1100 },
  { hours: 3, label: "3 hours", pence: 1400 },
  { hours: 4, label: "4+ hours (Day Pass)", pence: 1500 },
];

export const MAX_DESKS = 12;
export const OPENING_HOUR = 8;   // 8am
export const CLOSING_HOUR = 22;  // 10pm last start slot (so booking ends by 11pm max if 1hr)
export const MAX_END_HOUR = 23;  // latest end time (11pm)
