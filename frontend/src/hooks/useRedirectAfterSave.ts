import { useNavigate, useSearchParams } from 'react-router-dom'

export default function useRedirectAfterSave(defaultPath = '/') {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || defaultPath

  const goBack = (extra?: Record<string, string | number | null | undefined>) => {
    let url = redirect
    const qs = new URLSearchParams()

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') qs.set(k, String(v))
      })
    }

    if ([...qs.keys()].length) {
      url += (redirect.includes('?') ? '&' : '?') + qs.toString()
    }
    nav(url, { replace: true })
  }

  return { goBack }
}
