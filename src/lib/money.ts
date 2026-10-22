export function money(minor: string | bigint) {
  const value = BigInt(minor);
  return (
    'USD ' +
    (value / 100n).toLocaleString('en-US') +
    '.' +
    (value % 100n).toString().padStart(2, '0')
  );
}
export function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
export function dateOnly(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
  }).format(new Date(value));
}
