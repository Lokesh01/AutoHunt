import { useState } from "react";

//type will be generic for arguments and response data, need to be replaced with actual type while calling the hook
function useFetch<TArgs extends unknown[], TData>(
  cb: (...args: TArgs) => Promise<TData>
) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: TArgs): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return { data, setData, loading, error, fn };
}

export default useFetch;
