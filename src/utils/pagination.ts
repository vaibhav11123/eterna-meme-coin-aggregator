/**
 * Cursor-based pagination utilities
 */

export interface Cursor {
  index: number;
}

/**
 * Decode cursor from base64 string
 */
export function decodeCursor(cursorString: string | undefined): Cursor | null {
  if (!cursorString) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursorString, 'base64').toString('utf-8');
    const cursor = JSON.parse(decoded) as Cursor;
    return cursor;
  } catch (error) {
    return null;
  }
}

/**
 * Encode cursor to base64 string
 */
export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Apply pagination to an array
 */
export function paginate<T>(
  items: T[],
  limit: number,
  cursor: Cursor | null
): {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
} {
  const start = cursor?.index || 0;
  const end = start + limit;
  const paginatedData = items.slice(start, end);
  const hasMore = end < items.length;
  const nextCursor = hasMore ? encodeCursor({ index: end }) : null;

  return {
    data: paginatedData,
    nextCursor,
    hasMore,
  };
}

