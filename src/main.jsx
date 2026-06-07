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

async function handleJoin(userId, email) {
  const code = localStorage.getItem('mb_join_code')
  if (!code) return
  const { data: move } = await supabase.from('moves').select('id').eq('invite_code', code).single()
  if (!move) { localStorage.removeItem('mb_join_code'); return }
  await supabase.from('move_members').insert({ move_id: move.id, user_id: userId, email })
  localStorage.removeItem('mb_join_code')
}

function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && joinCode) await handleJoin(session.user.id, session.user.email)
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && joinCode) await handleJoin(session.user.id, session.user.email)
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
