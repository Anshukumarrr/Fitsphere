import type { UseFormSetError } from "react-hook-form";

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
