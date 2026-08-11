import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('itsm_user') || 'null'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('itsm_token')) { setLoading(false); return }
    api.get('/auth/profile').then(({ data }) => {
      setUser(data)
      localStorage.setItem('itsm_user', JSON.stringify(data))
    }).catch(() => {
      localStorage.removeItem('itsm_token')
      localStorage.removeItem('itsm_user')
      setUser(null)
    }).finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await api.post('/auth/login', credentials)
    localStorage.setItem('itsm_token', result.token)
    localStorage.setItem('itsm_user', JSON.stringify(result.user))
    setUser(result.user)
  }, [])
  const logout = useCallback(() => {
    localStorage.removeItem('itsm_token'); localStorage.removeItem('itsm_user'); setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
