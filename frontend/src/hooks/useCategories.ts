import { useState, useEffect } from "react";
import { categoryService } from "../services/category.service";
import type { Category, CategoryGroup } from "../types/category";

export function useCategories(limit = 20, group?: CategoryGroup) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    categoryService
      .list({ is_active: true, group, sort: "sort_order", page_size: limit })
      .then((data) => {
        if (!cancelled) {
          setCategories(data.items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [limit, group]);

  return { categories, loading, error };
}
