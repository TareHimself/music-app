const PENDING_PROFILES: Map<string, [number, string]> = new Map();

export function startStopProfile(
  targetId: string,
  targetDispayName = targetId
) {
  if (PENDING_PROFILES.has(targetId)) {
    const [startTime, displayName] = PENDING_PROFILES.get(targetId) || [
      0,
      "unk",
    ];
    const elapsed = performance.now() - startTime;
    const shouldDispayInMs = elapsed < 1000;
    PENDING_PROFILES.delete(targetId);
    console.log(
      `[${displayName}]: ${(shouldDispayInMs
        ? elapsed
        : elapsed / 1000
      ).toFixed(4)}${shouldDispayInMs ? "ms" : "s"}`
    );
  } else {
    PENDING_PROFILES.set(targetId, [performance.now(), targetDispayName]);
  }
}
