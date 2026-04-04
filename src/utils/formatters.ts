const pad = (value: number) => String(value).padStart(2, '0');

const parseDate = (value?: string) => {
  if (!value?.trim()) return null;

  const raw = value.trim();
  const directDate = new Date(raw);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const normalized = raw.replace('T', ' ').replace(/-/g, '/');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export function formatDate(value?: string, fallback = '') {
  const date = parseDate(value);

  if (!date) {
    return fallback;
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export function formatDateTime(value?: string, fallback = '') {
  const date = parseDate(value);

  if (!date) {
    return fallback;
  }

  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatCountStat(value?: number, fallback = '--') {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return value.toLocaleString('zh-CN');
}
