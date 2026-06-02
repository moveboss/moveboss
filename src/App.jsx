import { useState } from 'react'
import './App.css'

const TABS = ['Rooms', 'All Boxes', 'Packers', 'Reports']

function App() {
  const [activeTab, setActiveTab] = useState('Rooms')

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">
          <span className="logo-move">Move</span><span className="logo-boss">Boss</span>
        </h1>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Rooms</span>
          </div>
          <div className="stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Boxes</span>
          </div>
          <div className="stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Items</span>
          </div>
        </div>
        <nav className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="tab-content">
        {activeTab === 'Rooms' && (
          <div className="empty-state">
            <p>No rooms yet.</p>
            <button className="btn-primary">+ Add Room</button>
          </div>
        )}
        {activeTab === 'All Boxes' && (
          <div className="empty-state">
            <p>No boxes yet. Add a room first.</p>
          </div>
        )}
        {activeTab === 'Packers' && (
          <div className="empty-state">
            <p>No packers yet.</p>
            <button className="btn-primary">+ Add Packer</button>
          </div>
        )}
        {activeTab === 'Reports' && (
          <div className="empty-state">
            <p>No data to report yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
