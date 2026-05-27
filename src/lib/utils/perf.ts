import { dev } from '$app/environment';

export interface PerfTimer {
  step(label: string): void;
  end(label?: string): void;
}

const noop: PerfTimer = {
  step: () => {},
  end: () => {},
};

export function createPerfTimer(name: string): PerfTimer {
  if (!dev || typeof performance === 'undefined') {
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
