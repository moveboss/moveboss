import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
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
function BoxScreen({ box, room, isOwner, moveReady, session, onUpdate, onBack, onDelete }) {
  const [itemInput, setItemInput] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnpack, setConfirmUnpack] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [settingPin, setSettingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [pinSetError, setPinSetError] = useState('')
  const canvasRef = useRef(null)

  const boxedItems = box.items || []
  const isComplete = box.complete
  const isPrivate = box.isPrivate

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
    const qrText = `https://moveboss.vercel.app/?box=${box.id}`
    const url = await QRCode.toDataURL(qrText, { width: 256, margin: 2 })
    setQrDataUrl(url)
    onUpdate({ ...box, complete: true, qrDataUrl: url })
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
  }

  function reopenBox() {
    setQrDataUrl(null)
    onUpdate({ ...box, complete: false, qrDataUrl: null })
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 },
      colors: ['#9ca3af', '#6b7280', '#d1d5db'],
      scalar: 0.7, ticks: 40, gravity: 2, drift: 0 })
  }

  function handleUnlock() {
    if (pinInput === box.pin) {
      setUnlocked(true)
      setPinError('')
    } else {
      setPinError('Incorrect PIN. Try again.')
      setPinInput('')
    }
  }

  function handleSetPin() {
    if (newPin.length < 4) { setPinSetError('PIN must be at least 4 digits.'); return }
    if (newPin !== newPinConfirm) { setPinSetError('PINs don\'t match.'); return }
    onUpdate({ ...box, isPrivate: true, pin: newPin })
    setSettingPin(false)
    setNewPin('')
    setNewPinConfirm('')
    setPinSetError('')
    setUnlocked(true)
  }

  function handleRemovePrivate() {
    onUpdate({ ...box, isPrivate: false, pin: null })
    setUnlocked(false)
  }

  function printLabel() {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>MoveBoss Label – ${box.code}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .label-code { font-size: 32px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; }
        .label-room { font-size: 15px; color: #555; margin-bottom: 12px; }
        img { width: 120px; height: 120px; }
        .label-items { margin-top: 12px; text-align: left; width: 180px; }
        .label-items li { font-size: 12px; margin-bottom: 3px; }
        .label-footer { margin-top: 16px; font-size: 10px; color: #999; }
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

      {/* Private box — locked state */}
      {isPrivate && !unlocked && (
        <div className="private-box-card">
          <div className="private-box-icon">🔒</div>
          <div className="private-box-label">This box is private</div>
          <p className="private-box-hint">Enter the PIN to view contents</p>
          <div className="pin-row">
            <input
              className="form-input pin-input"
              type="number"
              placeholder="PIN"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            />
            <button className="btn-primary" onClick={handleUnlock}>Unlock</button>
          </div>
          {pinError && <p className="form-error">{pinError}</p>}
        </div>
      )}

      {/* Set PIN modal */}
      {settingPin && (
        <div className="private-box-card">
          <div className="private-box-label">🔒 Set a PIN for this box</div>
          <div className="form-group" style={{ width: '100%' }}>
            <input className="form-input" type="number" placeholder="Choose a PIN (4+ digits)" value={newPin} onChange={e => setNewPin(e.target.value)} />
            <input className="form-input" type="number" placeholder="Confirm PIN" value={newPinConfirm} onChange={e => setNewPinConfirm(e.target.value)} />
          </div>
          {pinSetError && <p className="form-error">{pinSetError}</p>}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button className="btn-cancel-modal" style={{ flex: 1 }} onClick={() => setSettingPin(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSetPin}>Set PIN</button>
          </div>
        </div>
      )}

      {/* Private toggle */}
      {(!isPrivate || unlocked) && !settingPin && (
        <div className="private-toggle-row">
          {isPrivate
            ? <>
                <span className="private-badge">🔒 Private box</span>
                <button className="btn-link" onClick={handleRemovePrivate}>Remove lock</button>
              </>
            : <button className="btn-link" style={{ fontSize: 13 }} onClick={() => setSettingPin(true)}>🔒 Make this box private</button>
          }
        </div>
      )}

      {!isComplete && (!isPrivate || unlocked) && (
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

      {(!isPrivate || unlocked) && (
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
      )}

      {!isComplete && (!isPrivate || unlocked) && (
        <button
          className="btn-primary btn-full"
          onClick={completeBox}
          disabled={boxedItems.length === 0}
          style={{ opacity: boxedItems.length === 0 ? 0.4 : 1 }}
        >
          ✓ Complete Box &amp; Get QR Code
        </button>
      )}

      {isComplete && (!isPrivate || unlocked) && (
        <div className="qr-section">
          <img src={box.qrDataUrl} alt="QR Code" className="qr-image" />
          <div className="qr-actions">
            <button className="btn-primary" onClick={printLabel}>🖨 Print Label</button>
            <a className="btn-primary" href={box.qrDataUrl} download={`${box.code}.png`}>⬇ Download QR</a>
          </div>
          {moveReady
            ? <button className="btn-reopen" onClick={() => setConfirmUnpack(true)}>📦 Mark as Unpacked</button>
            : <button className="btn-reopen" onClick={reopenBox}>↩ Reopen Box</button>
          }
          {confirmUnpack && (
            <DeleteConfirm
              title="Mark as Unpacked?"
              message="Are you sure? Marking a box unpacked will delete it from the move."
              onConfirm={() => { setConfirmUnpack(false); onDelete() }}
              onCancel={() => setConfirmUnpack(false)}
            />
          )}
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

      {(isOwner || room.assignedTo === session?.user?.id) && (
        <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
          🗑 Delete Box
        </button>
      )}
    </div>
  )
}

// ── Room Screen ──────────────────────────────────────────────────
function RoomScreen({ room, rooms, members, isOwner, session, onAddBox, onSelectBox, onBack, onRenameRoom, onRecolorRoom, onDeleteRoom, onAssignRoom }) {
  const boxes = room.boxes || []
  const usedCount = boxes.length
  const atLimit = usedCount >= 99
  const showWarning75 = usedCount >= 75 && usedCount < 90
  const showWarning90 = usedCount >= 90
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(room.name)
  const [editingColor, setEditingColor] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function printLabelSheet() {
    const packedBoxes = boxes.filter(b => b.complete && b.qrDataUrl)
    if (packedBoxes.length === 0) {
      alert('No packed boxes with QR codes yet. Pack and complete some boxes first!')
      return
    }
    const win = window.open('', '_blank')
    const labels = packedBoxes.map(b => `
      <div class="label">
        <div class="label-code" style="color:${room.color}">${b.code}</div>
        <div class="label-room">${room.name}</div>
        <img src="${b.qrDataUrl}" />
      </div>
    `).join('')
    win.document.write(`
      <html><head><title>Labels – ${room.name}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: sans-serif; }
        body { padding: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, 1fr); gap: 6px; height: calc(100vh - 16px); }
        .label { border: 1px dashed #ccc; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; page-break-inside: avoid; }
        .label-code { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
        .label-room { font-size: 12px; color: #555; }
        img { width: 100px; height: 100px; }
        @media print { body { padding: 4px; } .grid { height: calc(100vh - 8px); } }
      </style></head>
      <body><div class="grid">${labels}</div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

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
            {isOwner && (
              <>
                <button className="btn-edit-name" onClick={() => setEditing(true)} title="Rename room">✏️</button>
                <button className="btn-edit-name" onClick={() => setEditingColor(v => !v)} title="Change color">🎨</button>
              </>
            )}
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
                <span className="box-code">{box.code} {box.isPrivate ? '🔒' : ''}</span>
                <span className="box-item-count">{box.isPrivate ? '••••' : `${(box.items||[]).length} items`}</span>
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

      {/* Assign room — owner only */}
      {isOwner && members.length > 0 && (
        <div className="form-group">
          <label className="form-label">Assigned Packer</label>
          <select
            className="form-input"
            value={room.assignedTo || ''}
            onChange={e => onAssignRoom(room, e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>
            ))}
          </select>
        </div>
      )}

      {room.assignedTo && !isOwner && (
        <div className="assigned-badge">
          👤 {room.assignedTo === session.user.id ? 'This is your room' : 'Assigned to another packer'}
        </div>
      )}

      {confirmDelete && (
        <DeleteConfirm
          title="Delete Room"
          message={`"${room.name}" and all ${room.boxes.length} box${room.boxes.length !== 1 ? 'es' : ''} inside will be permanently deleted.`}
          onConfirm={() => onDeleteRoom(room)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {boxes.some(b => b.complete && b.qrDataUrl) && (
        <button className="btn-print-sheet" onClick={printLabelSheet}>
          🖨 Print Label Sheet
        </button>
      )}

      {isOwner && (
        <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
          🗑 Delete Room
        </button>
      )}
    </div>
  )
}

// ── Rooms Tab ────────────────────────────────────────────────────
function RoomsTab({ rooms, members, isOwner, onAddRoom, onSelectRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="empty-state">
        <p>No rooms yet.</p>
        {isOwner && <button className="btn-primary" onClick={onAddRoom}>+ Add Room</button>}
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
              <span className="room-card-boxes">{room.boxes.length} boxes{room.assignedTo ? ` · 👤 ${members.find(m => m.user_id === room.assignedTo)?.email?.split('@')[0] || 'assigned'}` : ''}</span>
            </div>
            <span className="room-card-arrow">›</span>
          </div>
        ))}
      </div>
      {isOwner && <button className="btn-primary btn-full" style={{ marginTop: 20 }} onClick={onAddRoom}>+ Add Room</button>}
    </div>
  )
}

// ── All Boxes Tab ────────────────────────────────────────────────
function AllBoxesTab({ rooms, onSelectBox }) {
  const [search, setSearch] = useState('')

  const allBoxes = rooms.flatMap(room =>
    room.boxes.map(box => ({ box, room }))
  )

  const query = search.trim().toLowerCase()

  const results = query === '' ? allBoxes : allBoxes.filter(({ box, room }) => {
    const matchesCode = box.code.toLowerCase().includes(query)
    const matchesRoom = room.name.toLowerCase().includes(query)
    const matchesItem = (box.items || []).some(i => i.name.toLowerCase().includes(query))
    return matchesCode || matchesRoom || matchesItem
  })

  if (rooms.length === 0) {
    return <div className="empty-state"><p>No boxes yet. Add a room first.</p></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="search-bar-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search items, boxes, or rooms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
      </div>

      {query && (
        <p className="search-results-label">
          {results.length === 0 ? 'No results found' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {results.length === 0 && query ? null : (
        <ul className="box-list">
          {results.map(({ box, room }) => {
            const matchingItems = query
              ? (box.items || []).filter(i => i.name.toLowerCase().includes(query))
              : []
            return (
              <li key={box.id} className="box-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                onClick={() => onSelectBox(room, box)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <span className="color-dot sm" style={{ background: room.color, border: room.colorName === 'White' ? '1px solid #ccc' : 'none' }} />
                  <span className="box-code">{box.code}</span>
                  <span className="box-item-count">{box.isPrivate ? '••••' : `${(box.items||[]).length} items`}</span>
                  <span className={`badge ${box.complete ? 'badge-complete' : 'badge-packing'}`}>
                    {box.complete ? 'Packed ✓' : 'Packing'}
                  </span>
                </div>
                {matchingItems.length > 0 && (
                  <div className="search-match-items">
                    {matchingItems.map(i => (
                      <span key={i.id} className="search-match-item">📦 {i.name}</span>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Packers Tab ──────────────────────────────────────────────────
function PackersTab({ inviteCode, members, setMembers, isOwner }) {
  const [copied, setCopied] = useState(false)
  const inviteLink = `${window.location.origin}/?join=${inviteCode}`

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleRole(member) {
    const newRole = member.role === 'owner' ? 'packer' : 'owner'
    await supabase.from('move_members').update({ role: newRole }).eq('user_id', member.user_id).eq('move_id', member.move_id)
    setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, role: newRole } : m))
  }

  if (!isOwner) {
    return (
      <div className="empty-state">
        <p>You're packing for someone else's move.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="report-card">
        <div className="report-card-title">🔗 Invite Packers</div>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          Share your join code or link. Helpers go to <strong>moveboss.vercel.app</strong>, create an account, and enter the code below.
        </p>
        <div className="invite-code-display">
          <span className="invite-code-text">{inviteCode}</span>
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Your join code — share this with packers</p>
        <div className="invite-link-box" style={{ marginTop: 8 }}>
          <span className="invite-link-text">{inviteLink}</span>
          <button className="btn-copy" onClick={copyLink}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="report-card">
        <div className="report-card-title">👥 Team ({members.length})</div>
        {members.length === 0
          ? <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>No one has joined yet. Share the invite link above!</p>
          : (
            <ul style={{ listStyle: 'none', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <li key={m.id} className="member-row">
                  <span className="member-avatar" style={{ background: m.role === 'owner' ? '#7C3AED' : '#1D9E75' }}>{(m.name || m.email||'?')[0].toUpperCase()}</span>
                  <span className="member-email">{m.name || m.email}</span>
                  <button
                    className={`badge ${m.role === 'owner' ? 'badge-complete' : 'badge-packing'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    onClick={() => toggleRole(m)}
                    title="Click to change role"
                  >
                    {m.role}
                  </button>
                </li>
              ))}
            </ul>
          )
        }
        {members.length > 0 && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>Tap a role badge to toggle between packer and owner.</p>}
      </div>

    </div>
  )
}

// ── Reports Tab ──────────────────────────────────────────────────
function ReportsTab({ rooms, onShowReady, moveReady, onBackToPacking }) {
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
        {totalBoxes > 0 && packedBoxes === totalBoxes && (
          <button className="btn-ready-trigger" onClick={onShowReady}>
            🚛 Ready for the Road!
          </button>
        )}
        {moveReady && (
          <button className="btn-back-to-packing" onClick={onBackToPacking}>
            ↩ Back to Packing
          </button>
        )}
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
  const [moveName, setMoveName] = useState('')
  const [editingMoveName, setEditingMoveName] = useState(false)
  const [moveNameInput, setMoveNameInput] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedBox, setSelectedBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)
  const [members, setMembers] = useState([])
  const [isOwner, setIsOwner] = useState(true)
  const [moveReady, setMoveReady] = useState(false)
  const [toasts, setToasts] = useState([])
  const [showReadyModal, setShowReadyModal] = useState(false)
  const prevRoomsRef = useRef([])

  const totalBoxes = rooms.reduce((sum, r) => sum + r.boxes.length, 0)
  const totalItems = rooms.reduce((sum, r) => sum + r.boxes.reduce((s, b) => s + (b.items||[]).length, 0), 0)

  // Load data from Supabase on mount, then subscribe to real-time changes
  useEffect(() => {
    loadData()
  }, [])

  // Set up real-time subscriptions once we have a moveId
  useEffect(() => {
    if (!moveId) return

    const channel = supabase
      .channel(`move-${moveId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `move_id=eq.${moveId}` }, () => reloadRooms(moveId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boxes', filter: `move_id=eq.${moveId}` }, () => reloadRooms(moveId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => reloadRooms(moveId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'move_members', filter: `move_id=eq.${moveId}` }, () => reloadMembers(moveId))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [moveId])

  function addToast(message, type = 'info') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  async function reloadRooms(mid) {
    const { data: roomRows } = await supabase.from('rooms').select('*').eq('move_id', mid)
    const { data: boxRows } = await supabase.from('boxes').select('*').eq('move_id', mid)
    const { data: itemRows } = await supabase.from('items').select('*')
    const loadedRooms = (roomRows || []).map(r => ({
      id: r.id, name: r.name, color: r.color, colorName: r.color_name, colorShort: r.color_short,
      startNum: r.start_num, nextNum: r.next_num, assignedTo: r.assigned_to,
      boxes: (boxRows || []).filter(b => b.room_id === r.id).map(b => ({
        id: b.id, num: b.num, code: b.code, complete: b.complete, qrDataUrl: b.qr_data_url,
        isPrivate: b.is_private, pin: b.pin,
        items: (itemRows || []).filter(i => i.box_id === b.id).map(i => ({ id: i.id, name: i.name }))
      }))
    }))

    // Compare to previous rooms to fire notifications
    const prev = prevRoomsRef.current
    if (prev.length > 0) {
      // Room assigned to current user
      loadedRooms.forEach(newRoom => {
        const oldRoom = prev.find(r => r.id === newRoom.id)
        if (newRoom.assignedTo === session.user.id && oldRoom?.assignedTo !== session.user.id) {
          addToast(`🏠 You've been assigned: ${newRoom.name}`, 'assign')
        }
        // Room fully packed (has boxes and all are complete)
        if (newRoom.boxes.length > 0) {
          const nowDone = newRoom.boxes.every(b => b.complete)
          const wasDone = oldRoom ? oldRoom.boxes.every(b => b.complete) : false
          if (nowDone && !wasDone) {
            addToast(`✅ ${newRoom.name} is fully packed!`, 'complete')
          }
        }
      })
      // Everything packed
      const allBoxes = loadedRooms.flatMap(r => r.boxes)
      const prevAllBoxes = prev.flatMap(r => r.boxes)
      if (allBoxes.length > 0 && allBoxes.every(b => b.complete) && !prevAllBoxes.every(b => b.complete)) {
        setShowReadyModal(true)
      }
    }

    prevRoomsRef.current = loadedRooms
    setRooms(loadedRooms)
  }

  async function reloadMembers(mid) {
    const { data: memberRows } = await supabase.from('move_members').select('*').eq('move_id', mid)
    setMembers(memberRows || [])
  }

  async function loadData() {
    setLoading(true)
    try {
      let move = null
      let owner = true

      // Check join code FIRST — takes priority over everything
      const pendingCode = localStorage.getItem('mb_join_code')
      if (pendingCode) {
        const { data: joinMove } = await supabase.from('moves').select('*').eq('invite_code', pendingCode).single()
        if (joinMove) {
          // Delete their own empty move if they have one
          const { data: ownedMoves } = await supabase.from('moves').select('*').eq('owner_id', session.user.id)
          const ownedMove = ownedMoves?.[0]
          if (ownedMove && ownedMove.id !== joinMove.id) {
            // Only delete if it's empty (no rooms)
            const { data: ownedRooms } = await supabase.from('rooms').select('id').eq('move_id', ownedMove.id)
            if (!ownedRooms || ownedRooms.length === 0) {
              await supabase.from('moves').delete().eq('id', ownedMove.id)
            }
          }
          // Add them as a member
          const fullName = session.user.user_metadata?.full_name || ''
          await supabase.from('move_members').insert(
            { move_id: joinMove.id, user_id: session.user.id, email: session.user.email, name: fullName }
          )
          localStorage.removeItem('mb_join_code')
          move = joinMove
          owner = false
        } else {
          localStorage.removeItem('mb_join_code')
        }
      }

      if (!move) {
        // Check if already a packer on someone else's move
        const { data: membership } = await supabase.from('move_members').select('move_id, role').eq('user_id', session.user.id).single()
        if (membership) {
          const { data: sharedMove } = await supabase.from('moves').select('*').eq('id', membership.move_id).single()
          move = sharedMove
          owner = membership.role === 'owner'
        } else {
          // Check if user owns a move
          const { data: ownedMoves } = await supabase.from('moves').select('*').eq('owner_id', session.user.id)
          move = ownedMoves?.[0]
          if (!move) {
            // Create new move
            const { data, error } = await supabase.from('moves').insert({ name: 'My Move', owner_id: session.user.id }).select().single()
            if (error) throw error
            move = data
          }
        }
      }

      setMoveId(move.id)
      setIsOwner(owner)
      setInviteCode(move.invite_code)
      setMoveName(move.name || 'My Move')
      setMoveNameInput(move.name || 'My Move')
      setMoveReady(move.is_ready || false)

      // Load members — ensure owner is always in the list
      let { data: memberRows } = await supabase.from('move_members').select('*').eq('move_id', move.id)
      memberRows = memberRows || []
      const alreadyMember = memberRows.some(m => m.user_id === session.user.id)
      if (!alreadyMember) {
        const ownerName = session.user.user_metadata?.full_name || session.user.email
        await supabase.from('move_members').insert({
          move_id: move.id, user_id: session.user.id,
          email: session.user.email, name: ownerName, role: 'owner'
        })
        const { data: refreshed } = await supabase.from('move_members').select('*').eq('move_id', move.id)
        memberRows = refreshed || []
      }
      setMembers(memberRows)

      // Load rooms
      const { data: roomRows } = await supabase.from('rooms').select('*').eq('move_id', move.id)
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
        assignedTo: r.assigned_to,
        boxes: (boxRows || []).filter(b => b.room_id === r.id).map(b => ({
          id: b.id,
          num: b.num,
          code: b.code,
          complete: b.complete,
          qrDataUrl: b.qr_data_url,
          isPrivate: b.is_private,
          pin: b.pin,
          items: (itemRows || []).filter(i => i.box_id === b.id).map(i => ({ id: i.id, name: i.name }))
        }))
      }))

      prevRoomsRef.current = loadedRooms
      setRooms(loadedRooms)

      // If opened via QR scan URL, navigate to that box
      const pendingBoxId = localStorage.getItem('mb_scan_box')
      if (pendingBoxId) {
        localStorage.removeItem('mb_scan_box')
        for (const room of loadedRooms) {
          const box = room.boxes.find(b => String(b.id) === String(pendingBoxId))
          if (box) { setSelectedRoom(room); setSelectedBox(box); setScreen('box'); break }
        }
      }
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
    // Find lowest available number in this room's range
    const usedNums = new Set(room.boxes.map(b => b.num))
    let num = room.startNum
    while (usedNums.has(num) && num < room.startNum + 99) num++
    if (num >= room.startNum + 99) return // room full

    const code = `${room.name.toUpperCase()}-${num}`
    const { data } = await supabase.from('boxes').insert({
      room_id: room.id,
      move_id: moveId,
      num,
      code,
      complete: false,
    }).select().single()
    const newBox = { id: data.id, num, code, items: [], complete: false, qrDataUrl: null }
    const updatedRoom = { ...room, boxes: [...room.boxes, newBox] }
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
      is_private: updatedBox.isPrivate || false,
      pin: updatedBox.pin || null,
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

  async function handleAssignRoom(room, userId) {
    await supabase.from('rooms').update({ assigned_to: userId || null }).eq('id', room.id)
    const updatedRoom = { ...room, assignedTo: userId || null }
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
      members={members}
      isOwner={isOwner}
      session={session}
      onAddBox={handleAddBox}
      onSelectBox={box => { setSelectedBox(box); setScreen('box') }}
      onBack={() => setScreen('home')}
      onRenameRoom={handleRenameRoom}
      onRecolorRoom={handleRecolorRoom}
      onDeleteRoom={handleDeleteRoom}
      onAssignRoom={handleAssignRoom}
    /></div>
  }
  if (screen === 'box') {
    return <div className="app"><BoxScreen
      box={selectedBox}
      room={selectedRoom}
      isOwner={isOwner}
      moveReady={moveReady}
      session={session}
      onUpdate={handleUpdateBox}
      onBack={() => setScreen('room')}
      onDelete={handleDeleteBox}
    /></div>
  }

  function fireFireworks() {
    const duration = 4000
    const end = Date.now() + duration
    const colors = ['#1D9E75', '#7C3AED', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899']
    ;(function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }

  async function handleSaveMoveName() {
    const finalName = moveNameInput.trim() || 'My Move'
    await supabase.from('moves').update({ name: finalName }).eq('id', moveId)
    setMoveName(finalName)
    setMoveNameInput(finalName)
    setEditingMoveName(false)
  }

  return (
    <div className="app">
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span>{t.message}</span>
              <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>✕</button>
            </div>
          ))}
        </div>
      )}
      {showReadyModal && (
        <div className="ready-overlay">
          <div className="ready-modal">
            <div className="ready-emoji">🚛</div>
            <h2 className="ready-title">Ready for the Road!</h2>
            <p className="ready-subtitle">Every single box is packed.<br/>You did it — time to move!</p>
            <button className="btn-letsgo" onClick={async () => { await supabase.from('moves').update({ is_ready: true }).eq('id', moveId); setMoveReady(true); fireFireworks(); setShowReadyModal(false) }}>
              Let's Go! 🎉
            </button>
            <button className="btn-ready-dismiss" onClick={() => setShowReadyModal(false)}>
              Not quite yet
            </button>
          </div>
        </div>
      )}
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
        <div className="move-name-row">
          {editingMoveName ? (
            <div className="move-name-edit">
              <input
                className="move-name-input"
                value={moveNameInput}
                onChange={e => setMoveNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveMoveName(); if (e.key === 'Escape') { setMoveNameInput(moveName); setEditingMoveName(false) } }}
                autoFocus
              />
              <button className="btn-save-name" onClick={handleSaveMoveName}>Save</button>
              <button className="btn-cancel-name" onClick={() => { setMoveNameInput(moveName); setEditingMoveName(false) }}>✕</button>
            </div>
          ) : (
            <div className="move-name-display">
              <span className="move-name-text">{moveName}</span>
              {isOwner && <button className="btn-edit-move-name" onClick={() => setEditingMoveName(true)}>✏️</button>}
            </div>
          )}
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
            members={members}
            isOwner={isOwner}
            onAddRoom={() => setScreen('addRoom')}
            onSelectRoom={room => { setSelectedRoom(room); setScreen('room') }}
          />
        )}
        {activeTab === 'All Boxes' && (
          <AllBoxesTab
            rooms={rooms}
            onSelectBox={(room, box) => { setSelectedRoom(room); setSelectedBox(box); setScreen('box') }}
          />
        )}
        {activeTab === 'Packers' && (
          <PackersTab
            inviteCode={inviteCode}
            members={members}
            setMembers={setMembers}
            isOwner={isOwner}
          />
        )}
        {activeTab === 'Reports' && (
          <ReportsTab
            rooms={rooms}
            moveReady={moveReady}
            onShowReady={() => setShowReadyModal(true)}
            onBackToPacking={async () => {
              await supabase.from('moves').update({ is_ready: false }).eq('id', moveId)
              setMoveReady(false)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
