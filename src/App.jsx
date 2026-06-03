import { useState, useRef } from 'react'
import QRCode from 'qrcode'
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
      boxes: [],
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

// ── Box Screen ───────────────────────────────────────────────────
function BoxScreen({ box, room, onUpdate, onBack }) {
  const [itemInput, setItemInput] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const canvasRef = useRef(null)

  const boxedItems = box.items || []
  const isComplete = box.complete

  function addItem() {
    const val = itemInput.trim()
    if (!val) return
    const newItems = [...boxedItems, { id: Date.now(), name: val }]
    onUpdate({ ...box, items: newItems })
    setItemInput('')
  }

  function removeItem(id) {
    onUpdate({ ...box, items: boxedItems.filter(i => i.id !== id) })
  }

  async function completeBox() {
    if (boxedItems.length === 0) return
    const qrText = `MOVEBOSS|${box.code}|${box.id}`
    const url = await QRCode.toDataURL(qrText, { width: 256, margin: 2 })
    setQrDataUrl(url)
    onUpdate({ ...box, complete: true, qrDataUrl: url })
  }

  function reopenBox() {
    setQrDataUrl(null)
    onUpdate({ ...box, complete: false, qrDataUrl: null })
  }

  function printLabel() {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>MoveBoss Label – ${box.code}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; }
        .label-code { font-size: 48px; font-weight: 800; letter-spacing: 2px; margin-bottom: 16px; }
        .label-room { font-size: 20px; color: #555; margin-bottom: 24px; }
        img { width: 200px; height: 200px; }
        .label-items { margin-top: 24px; text-align: left; width: 260px; }
        .label-items li { font-size: 14px; margin-bottom: 4px; }
        .label-footer { margin-top: 32px; font-size: 12px; color: #999; }
      </style></head><body>
      <div class="label-code" style="color:${room.color}">${box.code}</div>
      <div class="label-room">${room.name}</div>
      <img src="${box.qrDataUrl}" />
      <div class="label-items"><ul>${boxedItems.map(i => `<li>${i.name}</li>`).join('')}</ul></div>
      <div class="label-footer">MoveBoss</div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  const usedCount = room.boxes.length
  const showWarning75 = usedCount >= 75 && usedCount < 90
  const showWarning90 = usedCount >= 90

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="box-header-info">
          <span className="color-dot" style={{ background: room.color, border: room.colorName === 'White' ? '2px solid #ccc' : 'none' }} />
          <h2>{box.code}</h2>
          <span className={`badge ${isComplete ? 'badge-complete' : 'badge-packing'}`}>
            {isComplete ? 'Packed ✓' : 'Packing'}
          </span>
        </div>
      </div>

      {showWarning90 && <div className="warning warning-red">⚠️ Almost full! Only {99 - usedCount} boxes left in this range.</div>}
      {showWarning75 && !showWarning90 && <div className="warning warning-amber">📦 {usedCount} of 99 boxes used in this range.</div>}

      {!isComplete && (
        <div className="form-group">
          <label className="form-label">Add Item</label>
          <div className="item-input-row">
            <input
              className="form-input"
              placeholder="e.g. Coffee maker"
              value={itemInput}
              onChange={e => setItemInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button className="btn-primary" onClick={addItem}>Add</button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Items ({boxedItems.length})</label>
        {boxedItems.length === 0
          ? <p className="empty-hint">No items yet. Add something above.</p>
          : (
            <ul className="item-list">
              {boxedItems.map(item => (
                <li key={item.id} className="item-row">
                  <span>{item.name}</span>
                  {!isComplete && (
                    <button className="btn-remove" onClick={() => removeItem(item.id)}>✕</button>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </div>

      {!isComplete && (
        <button
          className="btn-primary btn-full"
          onClick={completeBox}
          disabled={boxedItems.length === 0}
          style={{ opacity: boxedItems.length === 0 ? 0.4 : 1 }}
        >
          ✓ Complete Box &amp; Get QR Code
        </button>
      )}

      {isComplete && (
        <div className="qr-section">
          <img src={box.qrDataUrl} alt="QR Code" className="qr-image" />
          <div className="qr-actions">
            <button className="btn-primary" onClick={printLabel}>🖨 Print Label</button>
            <a className="btn-primary" href={box.qrDataUrl} download={`${box.code}.png`}>⬇ Download QR</a>
          </div>
          <button className="btn-reopen" onClick={reopenBox}>↩ Reopen Box</button>
        </div>
      )}
    </div>
  )
}

// ── Room Screen ──────────────────────────────────────────────────
function RoomScreen({ room, onAddBox, onSelectBox, onBack }) {
  const boxes = room.boxes || []
  const usedCount = boxes.length
  const atLimit = usedCount >= 99
  const showWarning75 = usedCount >= 75 && usedCount < 90
  const showWarning90 = usedCount >= 90

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <span className="color-dot lg" style={{ background: room.color, border: room.colorName === 'White' ? '2px solid #ccc' : 'none' }} />
        <h2>{room.name}</h2>
      </div>

      {showWarning90 && <div className="warning warning-red">⚠️ Almost full! {99 - usedCount} boxes left in this range.</div>}
      {showWarning75 && !showWarning90 && <div className="warning warning-amber">📦 {usedCount} of 99 boxes used in this range.</div>}

      {boxes.length === 0
        ? <p className="empty-hint" style={{ paddingTop: 24 }}>No boxes yet. Add your first box!</p>
        : (
          <ul className="box-list">
            {boxes.map(box => (
              <li key={box.id} className="box-row" onClick={() => onSelectBox(box)}>
                <span className="box-code">{box.code}</span>
                <span className="box-item-count">{(box.items||[]).length} items</span>
                <span className={`badge ${box.complete ? 'badge-complete' : 'badge-packing'}`}>
                  {box.complete ? 'Packed ✓' : 'Packing'}
                </span>
              </li>
            ))}
          </ul>
        )
      }

      <button
        className="btn-primary btn-full"
        style={{ marginTop: 20 }}
        onClick={onAddBox}
        disabled={atLimit}
      >
        + Add New Box
      </button>
    </div>
  )
}

// ── Rooms Tab ────────────────────────────────────────────────────
function RoomsTab({ rooms, onAddRoom, onSelectRoom }) {
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
          <div key={room.id} className="room-card" onClick={() => onSelectRoom(room)}>
            <div className="room-card-bar" style={{ background: room.color, border: room.colorName === 'White' ? '1px solid #ccc' : 'none' }} />
            <div className="room-card-body">
              <span className="room-card-name">{room.name}</span>
              <span className="room-card-meta">{room.colorShort} · {room.startNum}–{room.startNum + 99}</span>
              <span className="room-card-boxes">{room.boxes.length} boxes</span>
            </div>
            <span className="room-card-arrow">›</span>
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
  const [screen, setScreen] = useState('home')
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedBox, setSelectedBox] = useState(null)

  const totalBoxes = rooms.reduce((sum, r) => sum + r.boxes.length, 0)
  const totalItems = rooms.reduce((sum, r) => sum + r.boxes.reduce((s, b) => s + (b.items||[]).length, 0), 0)

  function handleSaveRoom(room) {
    setRooms(prev => [...prev, room])
    setScreen('home')
  }

  function handleAddBox() {
    const room = selectedRoom
    const num = room.nextNum
    const code = `${room.colorShort}-${num}`
    const newBox = { id: Date.now(), num, code, items: [], complete: false, qrDataUrl: null }
    const updatedRoom = { ...room, nextNum: num + 1, boxes: [...room.boxes, newBox] }
    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setSelectedBox(newBox)
    setScreen('box')
  }

  function handleUpdateBox(updatedBox) {
    const updatedRoom = {
      ...selectedRoom,
      boxes: selectedRoom.boxes.map(b => b.id === updatedBox.id ? updatedBox : b)
    }
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setSelectedBox(updatedBox)
  }

  // Screen routing
  if (screen === 'addRoom') {
    return <div className="app"><AddRoomScreen rooms={rooms} onSave={handleSaveRoom} onCancel={() => setScreen('home')} /></div>
  }
  if (screen === 'room') {
    return <div className="app"><RoomScreen
      room={selectedRoom}
      onAddBox={handleAddBox}
      onSelectBox={box => { setSelectedBox(box); setScreen('box') }}
      onBack={() => setScreen('home')}
    /></div>
  }
  if (screen === 'box') {
    return <div className="app"><BoxScreen
      box={selectedBox}
      room={selectedRoom}
      onUpdate={handleUpdateBox}
      onBack={() => setScreen('room')}
    /></div>
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
            <span className="stat-number">{totalBoxes}</span>
            <span className="stat-label">Boxes</span>
          </div>
          <div className="stat">
            <span className="stat-number">{totalItems}</span>
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
          <RoomsTab
            rooms={rooms}
            onAddRoom={() => setScreen('addRoom')}
            onSelectRoom={room => { setSelectedRoom(room); setScreen('room') }}
          />
        )}
        {activeTab === 'All Boxes' && (
          rooms.length === 0
            ? <div className="empty-state"><p>No boxes yet. Add a room first.</p></div>
            : (
              <ul className="box-list">
                {rooms.flatMap(room => room.boxes.map(box => (
                  <li key={box.id} className="box-row" onClick={() => { setSelectedRoom(room); setSelectedBox(box); setScreen('box') }}>
                    <span className="color-dot sm" style={{ background: room.color, border: room.colorName === 'White' ? '1px solid #ccc' : 'none' }} />
                    <span className="box-code">{box.code}</span>
                    <span className="box-item-count">{(box.items||[]).length} items</span>
                    <span className={`badge ${box.complete ? 'badge-complete' : 'badge-packing'}`}>
                      {box.complete ? 'Packed ✓' : 'Packing'}
                    </span>
                  </li>
                )))}
              </ul>
            )
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
