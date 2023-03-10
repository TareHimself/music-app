export function batchArray<T>(items: T[], batchSize: number): T[][] {
  return items.reduce<T[][]>((batches, item, index) => {
    if (index % batchSize === 0) {
      batches.push([]);
    }

    batches[batches.length - 1]?.push(item);
    return batches;
  }, []);
}

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
