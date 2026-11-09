import { useEffect, useRef } from "react";

const LAST_ACTIVITY_KEY = "recipe-recommender:last-activity";
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;
const ACTIVITY_WRITE_THROTTLE_MS = 5_000;
const CHECK_INTERVAL_MS = 15_000;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;

const configuredMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
export const IDLE_TIMEOUT_MS =
  (Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_IDLE_TIMEOUT_MINUTES) * 60_000;

// Fallback for browsers where localStorage is unavailable (e.g. blocked storage).
let memoryLastActivity: number | null = null;

function readLastActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return memoryLastActivity;
  }
}

function writeLastActivity(timestamp: number) {
  memoryLastActivity = timestamp;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // Keep the in-memory value only.
  }
}

export function clearLastActivity() {
  memoryLastActivity = null;
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * Calls `onTimeout` once the user has been inactive for `timeoutMs`.
 * Activity is stored in localStorage so it is shared across tabs and survives
 * reloads/closed browsers (a stale timestamp on load triggers the timeout).
 * `onTimeout` should resolve to `true` when sign-out succeeded; otherwise it is retried.
 */
export function useIdleLogout(
  enabled: boolean,
  onTimeout: () => Promise<boolean>,
  timeoutMs: number = IDLE_TIMEOUT_MS,
) {
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    let timingOut = false;
    let lastWrite = 0;

    function isExpired(now: number) {
      const last = readLastActivity();
      return last !== null && now - last >= timeoutMs;
    }

    function triggerTimeout() {
      if (timingOut) return;
      timingOut = true;
      onTimeoutRef.current()
        .then((signedOut) => {
          if (!signedOut) timingOut = false;
        })
        .catch(() => {
          timingOut = false;
        });
    }

    function check() {
      if (isExpired(Date.now())) triggerTimeout();
    }

    function recordActivity() {
      if (timingOut || document.visibilityState !== "visible") return;
      const now = Date.now();
      // Check before recording so returning to an expired tab can't revive the session.
      if (isExpired(now)) {
        triggerTimeout();
        return;
      }
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      writeLastActivity(now);
    }

    if (isExpired(Date.now())) {
      triggerTimeout();
    } else {
      lastWrite = Date.now();
      writeLastActivity(lastWrite);
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { passive: true });
    }
    // Background tabs throttle timers, so re-check as soon as the tab is visible again.
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, recordActivity);
      }
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.clearInterval(interval);
    };
  }, [enabled, timeoutMs]);
}
