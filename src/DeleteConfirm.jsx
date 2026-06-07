import { useState } from 'react'

export default function DeleteConfirm({ title, message, onConfirm, onCancel }) {
  const [input, setInput] = useState('')
  const ready = input.trim().toUpperCase() === 'DELETE'

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <h2 className="modal-title">⚠️ {title}</h2>
        <p className="modal-message">{message}</p>
        <p className="modal-instruction">Type <strong>DELETE</strong> to confirm:</p>
        <input
          className="form-input"
          placeholder="DELETE"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn-cancel-modal" onClick={onCancel}>Cancel</button>
          <button
            className="btn-delete-confirm"
            disabled={!ready}
            onClick={() => ready && onConfirm()}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}
