import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Custom hook that wraps useNavigate to preserve repId query parameter
 * Usage: const navigate = useNavigateWithRepId()
 * Then use navigate() as normal - it will automatically preserve repId
 */
export function useNavigateWithRepId() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const repId = searchParams.get('repId')

  return (to, options) => {
    // If repId exists and we're navigating to a string path
    if (repId && typeof to === 'string') {
      // Check if path already has query params
      const separator = to.includes('?') ? '&' : '?'
      const pathWithRepId = `${to}${separator}repId=${repId}`
      navigate(pathWithRepId, options)
    } else {
      // No repId or navigating with an object, use normal navigate
      navigate(to, options)
    }
  }
}

