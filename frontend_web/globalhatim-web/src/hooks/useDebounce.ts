import { useState, useEffect } from 'react'

/**
 * Bir değeri verilen gecikme süresi (ms) kadar debounce eder.
 * Kullanım: const debouncedSearch = useDebounce(search, 400)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
