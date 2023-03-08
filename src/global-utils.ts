export function batchArray<T>(items: T[], batchSize: number): T[][] {
  return items.reduce<T[][]>((batches, item, index) => {
    if (index % batchSize === 0) {
      batches.push([]);
    }

    batches[batches.length - 1]?.push(item);
    return batches;
  }, []);
}
