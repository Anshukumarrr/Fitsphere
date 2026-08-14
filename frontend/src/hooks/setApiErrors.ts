import type { UseFormSetError } from "react-hook-form";

/**
 * Generic fallback error message for non-form API failures (e.g. dialog save).
 * Kept here alongside setApiErrors so all error-shape handling lives in one
 * module that is not a "component file" (fast-refresh rule).
 */
export function getError(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === "object") {
    const detail = (data as Record<string, unknown>).detail;
    if (typeof detail === "string") return detail;
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return "Something went wrong. Please try again.";
}

export function setApiErrors(
  err: unknown,
  setError: UseFormSetError<any>,
): string | null {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== "object")
    return "An unexpected error occurred.";

  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;

  let general: string | null = null;
  for (const [key, msgs] of Object.entries(obj)) {
    if (key === "non_field_errors") {
      general = Array.isArray(msgs) ? msgs.join(". ") : String(msgs);
    } else if (key === "detail") {
      general = String(msgs);
    } else {
      const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
      setError(key as any, { type: "server", message: msg });
    }
  }
  return general;
}
