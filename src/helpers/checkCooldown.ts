const cooldowns = new Map<string, number>();

export default function checkCooldown(key: string, command: string, cooldownSeconds: number): [boolean, number] {
  const mapKey = `${command}:${key}`;
  const now = Date.now();
  const expiresAt = cooldowns.get(mapKey) || 0;

  if (now < expiresAt) {
    const remaining = (expiresAt - now) / 1000;
    return [false, remaining];
  }

  cooldowns.set(mapKey, now + cooldownSeconds * 1000);
  return [true, 0];
}
