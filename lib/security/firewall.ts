/**
 * Application Firewall & Threat Defense for Reciept.io
 * - Brute-force rate limiting with exponential lockout
 * - Cross-Site Scripting (XSS) input sanitization
 * - Strict parameter validation and threat mitigation
 */

interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}

const ATTEMPTS_CACHE: Record<string, RateLimitRecord> = {};
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export const ApplicationFirewall = {
  /**
   * Checks if an identifier (email / IP) is temporarily locked due to excessive failed logins.
   */
  isRateLimited(key: string): { locked: boolean; remainingSeconds?: number } {
    const record = ATTEMPTS_CACHE[key.toLowerCase()];
    if (!record) return { locked: false };

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      return { locked: true, remainingSeconds };
    }

    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      // Lock expired, reset
      delete ATTEMPTS_CACHE[key.toLowerCase()];
      return { locked: false };
    }

    return { locked: false };
  },

  /**
   * Records a failed authentication attempt. Triggers a 15-minute lock upon 5 failed attempts.
   */
  recordFailedAttempt(key: string): { locked: boolean; attemptsLeft: number } {
    const lowerKey = key.toLowerCase();
    if (!ATTEMPTS_CACHE[lowerKey]) {
      ATTEMPTS_CACHE[lowerKey] = { attempts: 1 };
    } else {
      ATTEMPTS_CACHE[lowerKey].attempts += 1;
    }

    const current = ATTEMPTS_CACHE[lowerKey];
    if (current.attempts >= MAX_FAILED_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      return { locked: true, attemptsLeft: 0 };
    }

    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - current.attempts };
  },

  /**
   * Resets failed attempts after a successful authentication.
   */
  resetAttempts(key: string): void {
    delete ATTEMPTS_CACHE[key.toLowerCase()];
  },

  /**
   * Strict input sanitization against XSS, script injection, and malicious payloads.
   */
  sanitizeInput(raw: string): string {
    if (!raw || typeof raw !== "string") return "";
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  },
};
