import { useMe } from "./me";

/** Mirrors the server rule (ACCOUNTANT or ADMIN may write); the server still enforces it. */
export function useCanWrite() {
  const role = useMe().data?.context?.role;
  return role === "ADMIN" || role === "ACCOUNTANT";
}
