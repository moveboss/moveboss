import { useState } from 'react'
import './App.css'

const TABS = ['Rooms', 'All Boxes', 'Packers', 'Reports']

const COLORS = [
  { name: 'Red',        hex: '#E32636', short: 'RED' },
  { name: 'Yellow',     hex: '#FFD700', short: 'YEL' },
  { name: 'Blue',       hex: '#2563EB', short: 'BLU' },
  { name: 'Orange',     hex: '#F97316', short: 'ORG' },
  { name: 'Green',      hex: '#16A34A', short: 'GRN' },
  { name: 'Purple',     hex: '#7C3AED', short: 'PRP' },
  { name: 'White',      hex: '#FFFFFF', short: 'WHT' },
  { name: 'Gray',       hex: '#6B7280', short: 'GRY' },
  { name: 'Pink',       hex: '#EC4899', short: 'PNK' },
  { name: 'Brown',      hex: '#92400E', short: 'BRN' },
  { name: 'Beige',      hex: '#D4B896', short: 'BGE' },
  { name: 'Light Blue', hex: '#7DD3FC', short: 'LBL' },
  { name: 'Teal',       hex: '#0D9488', short: 'TEA' },
  { name: 'Maroon',     hex: '#7F1D1D', short: 'MAR' },
  { name: 'Mint',       hex: '#6EE7B7', short: 'MNT' },
]

const HUNDRED_BLOCKS = [100,200,300,400,500,600,700,800,900]

// ── Add Room Screen ──────────────────────────────────────────────
function AddRoomScreen({ rooms, onSave, onCancel }) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [customHex, setCustomHex] = useState('#1D9E75')
  const [selectedStart, setSelectedStart] = useState(null)
  const [error, setError] = useState('')

  const takenStarts = rooms.map(r => r.startNum)

  function handleSave() {
    if (!name.trim()) { setError('Please enter a room name.'); return }
    if (!selectedColor) { setError('Please choose a color.'); return }
    if (!selectedStart) { setError('Please choose a number range.'); return }
    setError('')
    onSave({
      id: Date.now(),
      name: name.trim(),
      color: selectedColor.hex,
      colorName: selectedColor.name,
      colorShort: selectedColor.short,
      startNum: selectedStart,
      nextNum: selectedStart + 1,
      boxCount: 0,
    })
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onCancel}>← Back</button>
        <h2>Add Room</h2>
      </div>

      <div className="form-group">
        <label className="form-label">Room Name</label>
        <input
          className="form-input"
          placeholder="e.g. Kitchen"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Color</label>
        <div className="color-grid">
          {COLORS.map(color => (
            <button
              key={color.name}
              className={`color-swatch ${selectedColor?.name === color.name ? 'selected' : ''} ${color.name === 'White' ? 'white-swatch' : ''}`}
              style={{ background: color.hex }}
              title={color.name}
              onClick={() => setSelectedColor(color)}
            />
          ))}
          {/* Custom color swatch */}
          <button
            className={`color-swatch custom-swatch ${selectedColor?.name === 'Custom' ? 'selected' : ''}`}
            style={{ background: selectedColor?.name === 'Custom' ? customHex : '#e5e7eb' }}
            title="Custom"
            onClick={() => setSelectedColor({ name: 'Custom', hex: customHex, short: 'CST' })}
          >
            {selectedColor?.name !== 'Custom' && <span className="custom-swatch-label">+</span>}
          </button>
        </div>
        {selectedColor?.name === 'Custom' && (
          <div className="custom-color-row">
            <input
              type="color"
              value={customHex}
              onChange={e => {
                setCustomHex(e.target.value)
                setSelectedColor({ name: 'Custom', hex: e.target.value, short: 'CST' })
              }}
              className="color-picker-input"
            />
            <span className="custom-hex-label">{customHex.toUpperCase()}</span>
          </div>
        )}
        {selectedColor && (
          <div className="color-preview">
            <span className="color-dot" style={{ background: selectedColor.hex, border: selectedColor.name === 'White' ? '2px solid #ccc' : 'none' }} />
            <span>{selectedColor.name === 'Custom' ? `Custom (${customHex.toUpperCase()})` : selectedColor.name}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Number Range</label>
        <div className="range-grid">
          {HUNDRED_BLOCKS.map(start => {
            const taken = takenStarts.includes(start)
            const takenRoom = rooms.find(r => r.startNum === start)
            return (
              <button
                key={start}
                className={`range-chip ${taken ? 'taken' : ''} ${selectedStart === start ? 'selected' : ''}`}
                onClick={() => !taken && setSelectedStart(start)}
                disabled={taken}
                title={taken ? `Used by ${takenRoom?.name}` : `${start}–${start + 99}`}
              >
                {start}–{start + 99}
                {taken && <span className="range-taken-label">{takenRoom?.name}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button className="btn-primary btn-full" onClick={handleSave}>Save Room</button>
    </div>
  )
}

// ── Rooms Tab ────────────────────────────────────────────────────
function RoomsTab({ rooms, onAddRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="empty-state">
        <p>No rooms yet.</p>
        <button className="btn-primary" onClick={onAddRoom}>+ Add Room</button>
      </div>
    )
  }
  return (
    <div>
      <div className="room-grid">
        {rooms.map(room => (
          <div key={room.id} className="room-card">
            <div className="room-card-bar" style={{ background: room.color, border: room.colorName === 'White' ? '1px solid #ccc' : 'none' }} />
            <div className="room-card-body">
              <span className="room-card-name">{room.name}</span>
              <span className="room-card-meta">{room.colorShort} · {room.startNum}–{room.startNum + 99}</span>
              <span className="room-card-boxes">{room.boxCount} boxes</span>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary btn-full" style={{ marginTop: 20 }} onClick={onAddRoom}>+ Add Room</button>
    </div>
  )
}

// ── App ──────────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState('Rooms')
  const [screen, setScreen] = useState('home') // 'home' | 'addRoom'
  const [rooms, setRooms] = useState([])

  function handleSaveRoom(room) {
    setRooms(prev => [...prev, room])
    setScreen('home')
  }

  if (screen === 'addRoom') {
    return (
      <div className="app">
        <AddRoomScreen
          rooms={rooms}
          onSave={handleSaveRoom}
          onCancel={() => setScreen('home')}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">
          <span className="logo-move">Move</span><span className="logo-boss">Boss</span>
        </h1>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">{rooms.length}</span>
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
          <RoomsTab rooms={rooms} onAddRoom={() => setScreen('addRoom')} />
        )}
        {activeTab === 'All Boxes' && (
          <div className="empty-state"><p>No boxes yet. Add a room first.</p></div>
        )}
        {activeTab === 'Packers' && (
          <div className="empty-state">
            <p>No packers yet.</p>
            <button className="btn-primary">+ Add Packer</button>
          </div>
        )}
        {activeTab === 'Reports' && (
          <div className="empty-state"><p>No data to report yet.</p></div>
        )}
      </main>
    </div>
  )
}

export default App
