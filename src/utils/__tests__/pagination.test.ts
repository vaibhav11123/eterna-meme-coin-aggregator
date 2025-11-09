import { decodeCursor, encodeCursor, paginate } from '../pagination';

describe('Pagination Utils', () => {
  describe('encodeCursor', () => {
    it('should encode cursor to base64 string', () => {
      const cursor = { index: 5 };
      const encoded = encodeCursor(cursor);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should encode cursor with index 0', () => {
      const cursor = { index: 0 };
      const encoded = encodeCursor(cursor);
      expect(encoded).toBeTruthy();
    });
  });

  describe('decodeCursor', () => {
    it('should decode valid base64 cursor', () => {
      const cursor = { index: 10 };
      const encoded = encodeCursor(cursor);
      const decoded = decodeCursor(encoded);
      expect(decoded.index).toBe(10);
    });

    it('should return default cursor for invalid input', () => {
      const decoded = decodeCursor('invalid');
      expect(decoded.index).toBe(0);
    });

    it('should return default cursor for empty input', () => {
      const decoded = decodeCursor();
      expect(decoded.index).toBe(0);
    });
  });

  describe('paginate', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ id: i, value: `item${i}` }));

    it('should paginate data correctly', () => {
      const result = paginate(data, 10, { index: 0 });
      expect(result.data.length).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeTruthy();
    });

    it('should return empty data when index exceeds array length', () => {
      const result = paginate(data, 10, { index: 30 });
      expect(result.data.length).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should return hasMore false on last page', () => {
      const result = paginate(data, 10, { index: 20 });
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });
});

