export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
    .toUpperCase();
}

// Deterministic per-customer color (like GitHub/Slack-style generated
// avatars) - there's no real photo-upload feature, so the previous UI
// showed the same stock stranger's photo for every signed-in customer.
export function avatarHueFor(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash % 360;
}
