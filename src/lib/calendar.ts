const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export function localDate(value: Date) {
  const p = dateFormatter.formatToParts(value);
  return ['year', 'month', 'day'].map((k) => p.find((x) => x.type === k)!.value).join('-');
}
export function addCalendarDays(date: string, days: number) {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
