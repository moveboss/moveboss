import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function Scanner({ rooms, onClose }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    Html5Qrcode.getCameras().then(cameras => {
      if (!cameras.length) { setError('No camera found.'); return }
      // prefer back camera
      const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1]
      scanner.start(
        cam.id,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          if (started.current) return
          started.current = true
          scanner.stop().catch(() => {})
          handleScan(text)
        },
        () => {}
      ).catch(err => setError('Camera error: ' + err))
    }).catch(() => setError('Could not access camera. Make sure you allow camera permission.'))

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  function handleScan(text) {
    let boxId = null
    // New format: https://moveboss.vercel.app/?box=BOX-ID
    if (text.includes('moveboss.vercel.app') || text.includes('?box=')) {
      try { boxId = new URL(text).searchParams.get('box') } catch { boxId = text.split('?box=')[1] }
    } else {
      // Old format: MOVEBOSS|BOX-CODE|BOX-ID
      const parts = text.split('|')
      if (parts[0] === 'MOVEBOSS' && parts.length >= 3) boxId = parts[2]
    }
    if (!boxId) { setError('This QR code is not a MoveBoss label.'); return }
    for (const room of rooms) {
      const box = room.boxes.find(b => String(b.id) === String(boxId))
      if (box) { setResult({ room, box }); return }
    }
    setError('Box not found in your move. It may belong to a different account.')
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-sheet">
        <div className="scanner-header">
          <h2>Scan a Box</h2>
          <button className="btn-back" onClick={onClose}>✕ Close</button>
        </div>

        {!result && !error && (
          <>
            <p className="scanner-hint">Point your camera at a box QR code</p>
            <div id="qr-reader" className="qr-reader-box" />
          </>
        )}

        {error && (
          <div className="scanner-result">
            <div className="warning warning-red">{error}</div>
            <button className="btn-primary btn-full" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
          </div>
        )}

        {result && (
          <div className="scanner-result">
            <div className="scan-success-icon">✓</div>
            <div className="scan-box-code" style={{ color: result.room.color }}>{result.box.code}</div>
            <div className="scan-room-name">{result.room.name}</div>
            <div className="scan-items-label">Contents ({result.box.items.length} items)</div>
            {result.box.items.length === 0
              ? <p className="empty-hint">No items listed for this box.</p>
              : (
                <ul className="item-list" style={{ width: '100%' }}>
                  {result.box.items.map(item => (
                    <li key={item.id} className="item-row">{item.name}</li>
                  ))}
                </ul>
              )
            }
            <button className="btn-primary btn-full" style={{ marginTop: 16 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
