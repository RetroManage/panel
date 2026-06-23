import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import LoadingBar from 'react-top-loading-bar'

export function TopLoadingBar() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(35)
    const mid = window.setTimeout(() => setProgress(70), 120)
    const done = window.setTimeout(() => setProgress(100), 280)
    const reset = window.setTimeout(() => setProgress(0), 520)
    return () => {
      window.clearTimeout(mid)
      window.clearTimeout(done)
      window.clearTimeout(reset)
    }
  }, [location.pathname])

  return <LoadingBar progress={progress} height={3} shadow={false} color="hsl(var(--primary))" />
}
