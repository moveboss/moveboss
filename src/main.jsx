import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx'
import { supabase } from './supabase.js'

// Read ?join= param from URL
const urlParams = new URLSearchParams(window.location.search)
const joinCode = urlParams.get('join')

async function handleJoin(userId, email) {
  if (!joinCode) return
  console.log('Joining with code:', joinCode)
  // Find the move with this invite code
  const { data: move, error: moveError } = await supabase.from('moves').select('id').eq('invite_code', joinCode).single()
  console.log('Move found:', move, 'Error:', moveError)
  if (!move) return
  // Add user as a member
  const { error: insertError } = await supabase.from('move_members').insert({ move_id: move.id, user_id: userId, email })
  console.log('Member insert error:', insertError)
  // Clean up URL
  window.history.replaceState({}, '', '/')
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
