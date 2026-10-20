export function addPeriod(date, amount, unit) {
  const [y, m, d] = date.split('-').map(Number);
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Interval must be a positive whole number');
  const target = new Date(Date.UTC(y + (unit === 'years' ? amount : 0), m - 1 + (unit === 'months' ? amount : 0), 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function daysUntil(date, now = today()) {
  return Math.round((Date.parse(date) - Date.parse(now)) / 86400000);
}
export function status(check, now = today()) {
  if (check.closed) return 'Complete';
  const days = daysUntil(check.due, now);
  return days < 0 ? 'Overdue' : days <= 30 ? 'Due soon' : 'Up to date';
}
export function complete(check, date) {
  return {...check, completed: date, due: check.interval ? addPeriod(date, check.interval, check.unit) : check.due, closed: !check.interval};
}
