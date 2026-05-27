export interface PerfTimer {
  step(label: string): void;
  end(label?: string): void;
}

const noop: PerfTimer = {
  step: () => {},
  end: () => {},
};

const _dev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export function createPerfTimer(name: string): PerfTimer {
  if (!_dev || typeof performance === 'undefined') {
    return noop;
  }

  const startedAt = performance.now();
  let last = startedAt;
  console.info(`[perf] ${name}: start`);

  return {
    step(label: string) {
      const now = performance.now();
      console.info(
        `[perf] ${name}: ${label} +${(now - last).toFixed(1)}ms (total ${(now - startedAt).toFixed(1)}ms)`,
      );
      last = now;
    },
    end(label: string = 'done') {
      const now = performance.now();
      console.info(`[perf] ${name}: ${label} ${(now - startedAt).toFixed(1)}ms total`);
    },
  };
}

export const perfCounters: Record<string, number> = {};

export function incrementCounter(name: string): void {
  if (!_dev) return;
  perfCounters[name] = (perfCounters[name] ?? 0) + 1;
}

export function logCounters(): void {
  if (!_dev) return;
  console.info('[perf] counters:', perfCounters);
}

export function logNoteStatesSize(size: number): void {
  if (!_dev) return;
  console.info(`[perf] noteStates.size: ${size}`);
}
