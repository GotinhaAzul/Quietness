export function resolvePlaceholders(text: string, title?: string): string {
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const map: Record<string, string> = {
    date,
    time,
    datetime: `${date} ${time}`,
    title: title ?? '',
  };

  return text.replace(/\{(date|time|datetime|title)\}/g, (_, key) => map[key] ?? _);
}
