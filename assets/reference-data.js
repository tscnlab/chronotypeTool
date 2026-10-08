// Fixed aggregate reference. No participant records or individual scores.
// Half-open 30-minute bins, ordered from noon to the following noon.
export default Object.freeze({
  schema: 1,
  metric: 'MSFsc',
  instrument: 'µMCTQ',
  n: 679,
  binMinutes: 30,
  startMinute: 720,
  counts: Object.freeze([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 3, 4, 21, 55, 123, 125, 105, 83, 66, 38, 25,
    13, 8, 3, 1, 4, 1, 1, 0, 0, 0, 0, 0,
  ]),
});
