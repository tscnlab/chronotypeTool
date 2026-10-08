// MCTQ sleep-timing core. Times and durations are in minutes; no intermediate rounding.
// Specification: https://docs.ropensci.org/mctq/reference/msf_sc.html
export const ALGORITHM = 'mctq-core-1.0.0';
export class InputError extends Error {
  constructor(code) { super(code); this.name = 'InputError'; this.code = code; }
}
export const wrap = n => ((n % 1440) + 1440) % 1440;
export function parseTime(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new InputError('time');
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}
export function sleepPeriod(period) {
  if (!period || typeof period !== 'object') throw new InputError('time');
  const prep = parseTime(period.prep), wake = parseTime(period.wake);
  const latency = period.latency;
  if (typeof latency !== 'number' || !Number.isInteger(latency) || latency < 0 || latency > 240) throw new InputError('latency');
  const interval = wrap(wake - prep);
  const duration = interval - latency;
  if (duration <= 0 || duration > 960) throw new InputError('duration');
  const onset = wrap(prep + latency);
  return { onset, wake, duration, midpoint: wrap(onset + duration / 2) };
}
export function correctedMidpoint(msf, sdW, sdF, weekly, alarmF = false) {
  if (alarmF) return null;
  return wrap(msf - (sdF > sdW ? (sdF - weekly) / 2 : 0));
}
export function scoreMctq(input) {
  if (!input || !Number.isInteger(input.workDays) || input.workDays < 0 || input.workDays > 7) throw new InputError('days');
  if (typeof input.shiftWork !== 'boolean') throw new InputError('shift');
  const base = { algorithm: ALGORITHM, eligible: false, msfsc: null };
  if (input.shiftWork) return { ...base, reason: 'shift' };
  // Conservative event eligibility: observed work AND free days are required.
  // No extrapolated/hypothetical schedules or missing-section substitutions.
  if (input.workDays === 0 || input.workDays === 7) return { ...base, reason: 'schedule' };
  const work = sleepPeriod(input.work), free = sleepPeriod(input.free);
  if (!['natural', 'alarm', 'other'].includes(input.freeWake)) throw new InputError('freeWake');
  const weekly = (work.duration * input.workDays + free.duration * (7 - input.workDays)) / 7;
  const correction = free.duration > work.duration ? (free.duration - weekly) / 2 : 0;
  const common = { ...base, work, free, weekly, correction };
  if (input.freeWake !== 'natural') return { ...common, reason: input.freeWake };
  return { ...common, eligible: true, reason: null, msfsc: correctedMidpoint(free.midpoint, work.duration, free.duration, weekly) };
}
export function formatTime(n) {
  const t = wrap(Math.round(n));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
