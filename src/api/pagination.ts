import type { Pagination } from '../types/api';

interface PagedResponse {
  pagination: Pagination;
}

export async function fetchAllPages<TResponse extends PagedResponse, TItem>(
  fetchPage: (page: number) => Promise<TResponse>,
  getItems: (response: TResponse) => TItem[],
): Promise<TItem[]> {
  const first = await fetchPage(1);
  const items: TItem[] = [...getItems(first)];
  const { total_pages } = first.pagination;
  if (total_pages <= 1) return items;

  const rest = await Promise.all(
    Array.from({ length: total_pages - 1 }, (_, i) => fetchPage(i + 2)),
  );
  rest.forEach((r) => items.push(...getItems(r)));
  return items;
}
