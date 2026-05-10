import { useState, useEffect } from 'react';
import { GoogleSheetsClient } from '../infrastructure/google-sheets.client';

interface UseSheetsDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useSheetsData<T>(sheetName: string): UseSheetsDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const gasUrl = import.meta.env.VITE_GAS_URL || '';
    const client = new GoogleSheetsClient(gasUrl);

    setLoading(true);
    setError(null);

    client
      .read(sheetName)
      .then((rows) => {
        setData(rows as T[]);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sheetName]);

  return { data, loading, error };
}
