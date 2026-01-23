export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
