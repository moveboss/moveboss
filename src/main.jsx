import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx'
import { supabase } from './supabase.js'

// Read ?join= param from URL and persist in localStorage
const urlParams = new URLSearchParams(window.location.search)
const urlJoinCode = urlParams.get('join')
if (urlJoinCode) {
  localStorage.setItem('mb_join_code', urlJoinCode)
  window.history.replaceState({}, '', '/')
}
const joinCode = urlJoinCode || localStorage.getItem('mb_join_code')

function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>
  if (!session) return <Auth joinCode={joinCode} />
  return <App session={session} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
