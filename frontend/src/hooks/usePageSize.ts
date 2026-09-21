import { useCallback, useState } from "react";

const STORAGE_KEY = "admin:page_size";
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

/**
 * Items-per-page preference for admin list screens, shared across all of
 * them and persisted in localStorage so it survives navigation and reloads.
 */
export function usePageSize() {
  const [pageSize, setPageSizeState] = useState<number>(() => {
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY));
      return PAGE_SIZE_OPTIONS.includes(stored) ? stored : DEFAULT_PAGE_SIZE;
    } catch {
      return DEFAULT_PAGE_SIZE;
    }
  });

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEY, String(size));
    } catch {
      // localStorage unavailable (private mode, etc.) — keep in-memory value only
    }
  }, []);

  return [pageSize, setPageSize] as const;
}
