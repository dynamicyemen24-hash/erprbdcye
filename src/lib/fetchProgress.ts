/**
 * NexoraOS™ Global Fetch Progress Tracker
 * Lightweight singleton that instruments every /api request end-to-end,
 * exposing a precise determinate progress (completed / total) via subscription.
 */

type Listener = (state: { active: boolean; progress: number }) => void;

let totalStarted = 0;
let totalCompleted = 0;
const listeners = new Set<Listener>();
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  const inFlight = totalStarted - totalCompleted;
  let progress = 0;
  if (totalStarted > 0) {
    progress = totalCompleted >= totalStarted ? 100 : Math.min(95, Math.round((totalCompleted / totalStarted) * 100));
  }
  const active = inFlight > 0;
  listeners.forEach(l => l({ active, progress }));
}

export const fetchProgress = {
  start() {
    // New burst begins: reset counters so the bar reflects the current round-trip only
    if (totalStarted === totalCompleted) {
      totalStarted = 0;
      totalCompleted = 0;
      if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    }
    totalStarted++;
    emit();
  },

  end(ok: boolean = true) {
    totalCompleted++;
    emit();
    // After everything settles, clear state shortly so next burst starts fresh
    if (totalCompleted >= totalStarted && ok) {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        totalStarted = 0;
        totalCompleted = 0;
        emit();
      }, 600);
    }
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener({
      active: totalStarted - totalCompleted > 0,
      progress: totalStarted > 0 ? (totalCompleted >= totalStarted ? 100 : Math.min(95, Math.round((totalCompleted / totalStarted) * 100))) : 0
    });
    return () => { listeners.delete(listener); };
  }
};
