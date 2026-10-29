import { useEffect, useState } from 'react';

// For Vercel deployment, leave VITE_API_URL empty to use relative paths
// The vercel.json config will route /api/* requests to the Express server
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function postCalculate<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function useRemoteCalc<TResult>(
  path: string,
  payload: Record<string, number | string>,
  initial: TResult,
): { result: TResult; error: string | null; loading: boolean } {
  const [result, setResult] = useState<TResult>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      postCalculate<TResult>(path, JSON.parse(payloadKey) as Record<string, number | string>, controller.signal)
        .then((data) => {
          setResult(data);
          setError(null);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError(err instanceof Error ? err.message : 'Calculation failed');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [path, payloadKey]);

  return { result, error, loading };
}
