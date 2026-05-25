const PALETTE = [
  '#1a6b3c', '#2563eb', '#7c3aed', '#b45309', '#0e7490',
  '#be123c', '#15803d', '#1d4ed8', '#6d28d9', '#92400e',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getInitialsAvatar(name: string): string {
  const bg = colorForName(name);
  const initials = initialsFor(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="${bg}"/>
  <text x="32" y="32" dy=".35em" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="${initials.length > 1 ? 22 : 26}" font-weight="600">${initials}</text>
</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
