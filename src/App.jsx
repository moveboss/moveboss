import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { supabase } from './supabase'
import Scanner from './Scanner'
import DeleteConfirm from './DeleteConfirm'
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

const HUNDRED_BLOCKS = [
  1000,1100,1200,1300,1400,
  1500,1600,1700,1800,1900,
  2000,2100,2200,2300,2400,
]
const MAX_ROOMS = 15

// ── Add Room Screen ──────────────────────────────────────────────
function AddRoomScreen({ rooms, onSave, onCancel }) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [customHex, setCustomHex] = useState('#1D9E75')
  const [selectedStart, setSelectedStart] = useState(null)
  const [error, setError] = useState('')

  const takenStarts = rooms.map(r => r.startNum)
  const takenColors = rooms.map(r => r.color)

  function handleSave() {
    if (!name.trim()) { setError('Please enter a room name.'); return }
    if (!selectedColor) { setError('Please choose a color.'); return }
    if (!selectedStart) { setError('Please choose a number range.'); return }
    setError('')
    const finalName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1)
    onSave({
      id: Date.now(),
      name: finalName,
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
          {COLORS.map(color => {
            const taken = takenColors.includes(color.hex)
            const takenRoom = rooms.find(r => r.color === color.hex)
            return (
              <button
                key={color.name}
                className={`color-swatch ${selectedColor?.name === color.name ? 'selected' : ''} ${color.name === 'White' ? 'white-swatch' : ''} ${taken ? 'swatch-taken' : ''}`}
                style={{ background: color.hex, opacity: taken ? 0.25 : 1 }}
                title={taken ? `Used by ${takenRoom?.name}` : color.name}
                onClick={() => !taken && setSelectedColor(color)}
                disabled={taken}
              />
            )
          })}
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

      {rooms.length >= MAX_ROOMS && (
        <div className="expand-note">
          🏠 Need more than 15 rooms? <a href="mailto:getmoveboss@gmail.com">Contact us</a> to expand your move.
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      <button className="btn-primary btn-full" onClick={handleSave} disabled={rooms.length >= MAX_ROOMS}>Save Room</button>
    </div>
  )
}

// ── Box Screen ───────────────────────────────────────────────────
function BoxScreen({ box, room, onUpdate, onBack, onDelete }) {
  const [itemInput, setItemInput] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
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

      {confirmDelete && (
        <DeleteConfirm
          title="Delete Box"
          message={`${box.code} and all its items will be permanently deleted.`}
          onConfirm={() => onDelete(box)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
        🗑 Delete Box
      </button>
    </div>
  )
}

// ── Room Screen ──────────────────────────────────────────────────
function RoomScreen({ room, rooms, onAddBox, onSelectBox, onBack, onRenameRoom, onRecolorRoom, onDeleteRoom }) {
  const boxes = room.boxes || []
  const usedCount = boxes.length
  const atLimit = usedCount >= 99
  const showWarning75 = usedCount >= 75 && usedCount < 90
  const showWarning90 = usedCount >= 90
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(room.name)
  const [editingColor, setEditingColor] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleRename() {
    const finalName = nameInput.trim().charAt(0).toUpperCase() + nameInput.trim().slice(1)
    if (finalName && finalName !== room.name) {
      onRenameRoom(room, finalName)
    }
    setEditing(false)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <span className="color-dot lg" style={{ background: room.color, border: room.colorName === 'White' ? '2px solid #ccc' : 'none' }} />
        {editing ? (
          <>
            <input
              className="form-input"
              style={{ flex: 1, padding: '6px 10px', fontSize: 16 }}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleRename}>Save</button>
            <button className="btn-back" onClick={() => { setNameInput(room.name); setEditing(false) }}>Cancel</button>
          </>
        ) : (
          <>
            <h2>{room.name}</h2>
            <button className="btn-edit-name" onClick={() => setEditing(true)} title="Rename room">✏️</button>
            <button className="btn-edit-name" onClick={() => setEditingColor(v => !v)} title="Change color">🎨</button>
          </>
        )}
      </div>

      {editingColor && (
        <div className="form-group">
          <label className="form-label">Choose a new color</label>
          <div className="color-grid">
            {COLORS.map(color => {
              const takenByOther = rooms.filter(r => r.id !== room.id).map(r => r.color).includes(color.hex)
              return (
                <button
                  key={color.name}
                  className={`color-swatch ${color.name === 'White' ? 'white-swatch' : ''} ${takenByOther ? 'swatch-taken' : ''}`}
                  style={{ background: color.hex, opacity: takenByOther ? 0.25 : 1 }}
                  title={takenByOther ? 'Already used' : color.name}
                  disabled={takenByOther}
                  onClick={() => { onRecolorRoom(room, color); setEditingColor(false) }}
                />
              )
            })}
          </div>
          <button className="btn-back" style={{ marginTop: 4 }} onClick={() => setEditingColor(false)}>Cancel</button>
        </div>
      )}

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

      {confirmDelete && (
        <DeleteConfirm
          title="Delete Room"
          message={`"${room.name}" and all ${room.boxes.length} box${room.boxes.length !== 1 ? 'es' : ''} inside will be permanently deleted.`}
          onConfirm={() => onDeleteRoom(room)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
        🗑 Delete Room
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
              <span className="room-card-meta">{room.startNum}–{room.startNum + 99}</span>
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

// ── Reports Tab ──────────────────────────────────────────────────
function ReportsTab({ rooms }) {
  const totalBoxes = rooms.reduce((sum, r) => sum + r.boxes.length, 0)
  const totalItems = rooms.reduce((sum, r) => sum + r.boxes.reduce((s, b) => s + (b.items||[]).length, 0), 0)
  const packedBoxes = rooms.reduce((sum, r) => sum + r.boxes.filter(b => b.complete).length, 0)
  const packingBoxes = totalBoxes - packedBoxes

  function printMasterList() {
    const win = window.open('', '_blank')
    const rows = rooms.map(room => {
      const boxRows = room.boxes.map(box => {
        const itemList = (box.items||[]).map(i => `<li>${i.name}</li>`).join('')
        const status = box.complete ? '✓ Packed' : 'Packing'
        return `
          <tr class="box-row">
            <td class="box-code-cell">${box.code}</td>
            <td class="status-cell ${box.complete ? 'packed' : 'packing'}">${status}</td>
            <td class="items-cell"><ul>${itemList || '<li style="color:#999">No items listed</li>'}</ul></td>
          </tr>`
      }).join('')
      return `
        <tr class="room-header-row">
          <td colspan="3">
            <span class="room-color-dot" style="background:${room.color};${room.colorName==='White'?'border:1px solid #ccc;':''}"></span>
            ${room.name} &nbsp;<span class="room-range">${room.startNum}–${room.startNum+99}</span>
            &nbsp;·&nbsp; ${room.boxes.length} boxes
          </td>
        </tr>
        ${boxRows}`
    }).join('')

    win.document.write(`
      <html><head><title>MoveBoss Master List</title>
      <style>
        body { font-family: sans-serif; font-size: 13px; color: #1a1a1a; padding: 32px; }
        h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        h1 span { color: #1D9E75; }
        .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 8px; }
        .stats { display: flex; gap: 32px; margin-bottom: 24px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e5e5; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-num { font-size: 22px; font-weight: 700; color: #1D9E75; }
        .stat-lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        .room-header-row td { background: #f0fdf8; font-weight: 700; font-size: 14px; padding: 10px 12px; border-top: 2px solid #1D9E75; }
        .room-color-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
        .room-range { font-weight: 400; color: #6b7280; }
        .box-row td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
        .box-code-cell { font-weight: 700; width: 130px; }
        .status-cell { width: 90px; font-size: 12px; font-weight: 600; }
        .packed { color: #15803d; }
        .packing { color: #b45309; }
        .items-cell ul { margin: 0; padding-left: 16px; }
        .items-cell li { margin-bottom: 2px; }
        .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 16px; } }
      </style></head>
      <body>
        <h1>Move<span>Boss</span> Master List</h1>
        <p class="subtitle">Printed ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <div class="stats">
          <div class="stat-item"><span class="stat-num">${rooms.length}</span><span class="stat-lbl">Rooms</span></div>
          <div class="stat-item"><span class="stat-num">${totalBoxes}</span><span class="stat-lbl">Boxes</span></div>
          <div class="stat-item"><span class="stat-num">${packedBoxes}</span><span class="stat-lbl">Packed</span></div>
          <div class="stat-item"><span class="stat-num">${totalItems}</span><span class="stat-lbl">Items</span></div>
        </div>
        <table>${rows}</table>
        <div class="footer">Generated by MoveBoss · moveboss.vercel.app</div>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  if (rooms.length === 0) {
    return (
      <div className="empty-state">
        <p>Add rooms and boxes first, then generate reports here.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Progress bar */}
      <div className="report-card">
        <div className="report-card-title">📦 Packing Progress</div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: totalBoxes ? `${Math.round(packedBoxes/totalBoxes*100)}%` : '0%' }} />
        </div>
        <div className="progress-label">
          {packedBoxes} of {totalBoxes} boxes packed
          {totalBoxes > 0 && <span className="progress-pct"> · {Math.round(packedBoxes/totalBoxes*100)}%</span>}
        </div>
      </div>

      {/* Room breakdown */}
      <div className="report-card">
        <div className="report-card-title">🏠 Rooms</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {rooms.map(room => {
            const packed = room.boxes.filter(b => b.complete).length
            const total = room.boxes.length
            const pct = total ? Math.round(packed/total*100) : 0
            return (
              <div key={room.id} className="room-report-row">
                <span className="color-dot sm" style={{ background: room.color, border: room.colorName==='White'?'1px solid #ccc':'' }} />
                <span className="room-report-name">{room.name}</span>
                <span className="room-report-stat">{packed}/{total} packed</span>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="report-card">
        <div className="report-card-title">📊 Summary</div>
        <div className="summary-grid">
          <div className="summary-stat"><span className="summary-num">{rooms.length}</span><span className="summary-lbl">Rooms</span></div>
          <div className="summary-stat"><span className="summary-num">{totalBoxes}</span><span className="summary-lbl">Total Boxes</span></div>
          <div className="summary-stat"><span className="summary-num" style={{color:'#15803d'}}>{packedBoxes}</span><span className="summary-lbl">Packed</span></div>
          <div className="summary-stat"><span className="summary-num" style={{color:'#b45309'}}>{packingBoxes}</span><span className="summary-lbl">Still Packing</span></div>
          <div className="summary-stat"><span className="summary-num">{totalItems}</span><span className="summary-lbl">Items Logged</span></div>
        </div>
      </div>

      {/* Print button */}
      <button className="btn-primary btn-full" onClick={printMasterList}>
        🖨 Print Master List
      </button>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: -8 }}>
        Opens a print-ready page with every room, box, and item
      </p>
    </div>
  )
}

// ── App ──────────────────────────────────────────────────────────
function App({ session }) {
  const [activeTab, setActiveTab] = useState('Rooms')
  const [screen, setScreen] = useState('home')
  const [rooms, setRooms] = useState([])
  const [moveId, setMoveId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedBox, setSelectedBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  const totalBoxes = rooms.reduce((sum, r) => sum + r.boxes.length, 0)
  const totalItems = rooms.reduce((sum, r) => sum + r.boxes.reduce((s, b) => s + (b.items||[]).length, 0), 0)

  // Load data from Supabase on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Get or create the move for this user
      let { data: moves, error: movesError } = await supabase.from('moves').select('*').eq('owner_id', session.user.id)
      if (movesError) throw movesError

      let move = moves?.[0]
      if (!move) {
        const { data, error } = await supabase.from('moves').insert({ name: 'My Move', owner_id: session.user.id }).select().single()
        if (error) throw error
        move = data
      }
      setMoveId(move.id)

      // Load rooms
      const { data: roomRows, error: roomsError } = await supabase.from('rooms').select('*').eq('move_id', move.id)
      if (roomsError) throw roomsError

      // Load boxes and items
      const { data: boxRows } = await supabase.from('boxes').select('*').eq('move_id', move.id)
      const { data: itemRows } = await supabase.from('items').select('*')

      const loadedRooms = (roomRows || []).map(r => ({
        id: r.id,
        name: r.name,
        color: r.color,
        colorName: r.color_name,
        colorShort: r.color_short,
        startNum: r.start_num,
        nextNum: r.next_num,
        boxes: (boxRows || []).filter(b => b.room_id === r.id).map(b => ({
          id: b.id,
          num: b.num,
          code: b.code,
          complete: b.complete,
          qrDataUrl: b.qr_data_url,
          items: (itemRows || []).filter(i => i.box_id === b.id).map(i => ({ id: i.id, name: i.name }))
        }))
      }))

      setRooms(loadedRooms)
    } catch (err) {
      console.error('Load error:', err)
      alert('Error loading data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRoom(room) {
    const { data } = await supabase.from('rooms').insert({
      move_id: moveId,
      name: room.name,
      color: room.color,
      color_name: room.colorName,
      color_short: room.colorShort,
      start_num: room.startNum,
      next_num: room.nextNum,
    }).select().single()
    const newRoom = { ...room, id: data.id, boxes: [] }
    setRooms(prev => [...prev, newRoom])
    setScreen('home')
  }

  async function handleAddBox() {
    const room = selectedRoom
    const num = room.nextNum
    const code = `${room.name.toUpperCase()}-${num}`
    const { data } = await supabase.from('boxes').insert({
      room_id: room.id,
      move_id: moveId,
      num,
      code,
      complete: false,
    }).select().single()
    // Update next_num in DB
    await supabase.from('rooms').update({ next_num: num + 1 }).eq('id', room.id)
    const newBox = { id: data.id, num, code, items: [], complete: false, qrDataUrl: null }
    const updatedRoom = { ...room, nextNum: num + 1, boxes: [...room.boxes, newBox] }
    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setSelectedBox(newBox)
    setScreen('box')
  }

  async function handleUpdateBox(updatedBox) {
    // Save box changes to DB
    await supabase.from('boxes').update({
      complete: updatedBox.complete,
      qr_data_url: updatedBox.qrDataUrl,
    }).eq('id', updatedBox.id)

    // Sync items — delete all and re-insert
    await supabase.from('items').delete().eq('box_id', updatedBox.id)
    if (updatedBox.items.length > 0) {
      await supabase.from('items').insert(updatedBox.items.map(i => ({ box_id: updatedBox.id, name: i.name })))
    }

    const updatedRoom = {
      ...selectedRoom,
      boxes: selectedRoom.boxes.map(b => b.id === updatedBox.id ? updatedBox : b)
    }
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setSelectedBox(updatedBox)
  }

  async function handleRenameRoom(room, newName) {
    await supabase.from('rooms').update({ name: newName }).eq('id', room.id)
    const updatedRoom = { ...room, name: newName }
    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
  }

  async function handleDeleteRoom(room) {
    // Delete items, boxes, then room
    for (const box of room.boxes) {
      await supabase.from('items').delete().eq('box_id', box.id)
    }
    await supabase.from('boxes').delete().eq('room_id', room.id)
    await supabase.from('rooms').delete().eq('id', room.id)
    setRooms(prev => prev.filter(r => r.id !== room.id))
    setScreen('home')
  }

  async function handleDeleteBox(box) {
    await supabase.from('items').delete().eq('box_id', box.id)
    await supabase.from('boxes').delete().eq('id', box.id)
    const updatedRoom = { ...selectedRoom, boxes: selectedRoom.boxes.filter(b => b.id !== box.id) }
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setScreen('room')
  }

  async function handleRecolorRoom(room, color) {
    await supabase.from('rooms').update({ color: color.hex, color_name: color.name, color_short: color.short }).eq('id', room.id)
    const updatedRoom = { ...room, color: color.hex, colorName: color.name, colorShort: color.short }
    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
  }

  // Screen routing
  if (loading) return <div className="app"><div className="empty-state" style={{paddingTop:100}}>Loading your move...</div></div>

  if (screen === 'addRoom') {
    return <div className="app"><AddRoomScreen rooms={rooms} onSave={handleSaveRoom} onCancel={() => setScreen('home')} /></div>
  }
  if (screen === 'room') {
    return <div className="app"><RoomScreen
      room={selectedRoom}
      rooms={rooms}
      onAddBox={handleAddBox}
      onSelectBox={box => { setSelectedBox(box); setScreen('box') }}
      onBack={() => setScreen('home')}
      onRenameRoom={handleRenameRoom}
      onRecolorRoom={handleRecolorRoom}
      onDeleteRoom={handleDeleteRoom}
    /></div>
  }
  if (screen === 'box') {
    return <div className="app"><BoxScreen
      box={selectedBox}
      room={selectedRoom}
      onUpdate={handleUpdateBox}
      onBack={() => setScreen('room')}
      onDelete={handleDeleteBox}
    /></div>
  }

  return (
    <div className="app">
      {scanning && <Scanner rooms={rooms} onClose={() => setScanning(false)} />}
      <header className="app-header">
        <div className="header-top">
          <h1 className="logo">
            <span className="logo-move">Move</span><span className="logo-boss">Boss</span>
          </h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn-scan" onClick={() => setScanning(true)}>📷 Scan</button>
            <button className="btn-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
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
          <ReportsTab rooms={rooms} />
        )}
      </main>
    </div>
  )
}

export default App
