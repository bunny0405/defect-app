'use client'
import { useState, useRef, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner'
import styles from './DefectForm.module.css'

const STORES = ['AS62 南西IP店', 'AS70 西門IP店']
const DEFECT_TYPES = ['進貨損壞', '陳列耗損']


export default function DefectForm() {
  const [store, setStore] = useState('')
  const [date, setDate] = useState('')
  const [staff, setStaff] = useState('')
  const [barcode, setBarcode] = useState('')
  const [qty, setQty] = useState(1)
  const [defectType, setDefectType] = useState('')
  const [desc, setDesc] = useState('')
  const [transferNo, setTransferNo] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
  }, [])

  const handleFiles = (files) => {
    const arr = Array.from(files)
    arr.forEach(file => {
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      if (!isImage && !isVideo) return
      if (isVideo && file.size > 100 * 1024 * 1024) { setError('影片超過 100MB'); return }
      const imgCount = mediaFiles.filter(m => m.isImage).length
      const vidCount = mediaFiles.filter(m => m.isVideo).length
      if (isImage && imgCount >= 6) { setError('照片最多 6 張'); return }
      if (isVideo && vidCount >= 1) { setError('影片最多 1 支'); return }
      const reader = new FileReader()
      reader.onload = (e) => {
        setMediaFiles(prev => [...prev, {
          name: file.name,
          src: e.target.result,
          b64: e.target.result.split(',')[1],
          mime: file.type,
          isImage,
          isVideo
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeMedia = (i) => {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    setError('')
    if (!store) return setError('請選擇門市')
    if (!barcode) return setError('請輸入或掃描商品條碼')
    if (qty < 1) return setError('瑕疵數量至少為 1')
    if (!defectType) return setError('請選擇瑕疵類型')
    if (!desc) return setError('請填寫瑕疵說明')
    if (mediaFiles.length === 0) return setError('請至少上傳一張照片')
    if (!transferNo) return setError('請填寫調撥單號')

    setSubmitting(true)
    setProgress(10)

    const payload = {
      store, date, staff, barcode, qty, defectType, desc,
      transferNo, transferNote,
      files: mediaFiles.map((m, i) => ({
        index: i + 1, filename: m.name, mime: m.mime, b64: m.b64
      }))
    }

    setProgress(30)

    const SCRIPT_URL = 'https://script.google.com/a/macros/airspaceonline.com/s/AKfycbxMEksqqYseXlaLKYMomV20fgtk9DGCKO_RA9QyCcMVBhVNhUx-5522-ySlCQgifKDPCA/exec'

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      })
      setProgress(100)
      setTimeout(() => setSuccess({ payload, folderUrl: 'https://drive.google.com/drive/folders/' }), 400)
    } catch (err) {
      setError('提交失敗：' + err.message)
      setSubmitting(false)
      setProgress(0)
    }
  }

  const reset = () => {
    setStore(''); setDate(new Date().toISOString().split('T')[0])
    setStaff(''); setBarcode(''); setQty(1); setDefectType('')
    setDesc(''); setTransferNo(''); setTransferNote('')
    setMediaFiles([]); setError(''); setProgress(0)
    setSubmitting(false); setSuccess(null); setShowScanner(false)
  }

  if (success) {
    const ic = success.payload.files.filter(f => f.mime.startsWith('image')).length
    const vc = success.payload.files.filter(f => f.mime.startsWith('video')).length
    return (
      <div className={styles.successPage}>
        <div className={styles.successRing}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className={styles.successTitle}>通報已提交 ✓</h2>
        <p className={styles.successSub}>照片已上傳至 Google Drive</p>
        <a href={success.folderUrl} target="_blank" rel="noreferrer" className={styles.successLink}>
          開啟 Google Drive 資料夾 →
        </a>
        <div className={styles.successSummary}>
          <div><strong>門市</strong>　{success.payload.store}</div>
          <div><strong>日期</strong>　{success.payload.date}</div>
          <div><strong>條碼</strong>　{success.payload.barcode}</div>
          <div><strong>數量</strong>　{success.payload.qty} 件</div>
          <div><strong>類型</strong>　{success.payload.defectType}</div>
          <div><strong>說明</strong>　{success.payload.desc}</div>
          <div><strong>調撥單號</strong>　{success.payload.transferNo}</div>
          <div><strong>上傳</strong>　{ic > 0 ? `照片 ${ic} 張` : ''}{ic > 0 && vc > 0 ? '、' : ''}{vc > 0 ? `影片 ${vc} 支` : ''}</div>
        </div>
        <button className={styles.resetBtn} onClick={reset}>繼續填寫下一份</button>
      </div>
    )
  }

  const imgCount = mediaFiles.filter(m => m.isImage).length
  const vidCount = mediaFiles.filter(m => m.isVideo).length

  return (
    <>
<header className={styles.header}>
        <h1>瑕疵品通報</h1>
        <span>DEFECT REPORT</span>
      </header>

      <div className={styles.body}>
        <div className={styles.driveBar}>
          <svg width="22" height="19" viewBox="0 0 87 78" fill="none">
            <path d="M29 0L58 0L87 50H58L29 0Z" fill="#1FA463"/>
            <path d="M0 50L14.5 25L44 75H15L0 50Z" fill="#FBBC04"/>
            <path d="M44 75H87L72.5 50H29.5L44 75Z" fill="#4285F4"/>
          </svg>
          <div>
            <div className={styles.driveLabel}>Google Drive 上傳</div>
            <div className={styles.driveSub}>照片與影片儲存至「瑕疵品通報」資料夾</div>
          </div>
        </div>

        {/* 1. 基本資訊 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.stepNum}>1</div>
            <h2>基本資訊</h2>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>門市<span className={styles.req}>*</span></label>
              <select value={store} onChange={e => setStore(e.target.value)}>
                <option value="">請選擇</option>
                {/* ★ 新增店櫃：加一行 <option>代號 店名</option> */}
                {STORES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>回報日期<span className={styles.req}>*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className={styles.field}>
            <label>負責人員</label>
            <input type="text" placeholder="姓名" value={staff} onChange={e => setStaff(e.target.value)} />
          </div>
        </div>

        {/* 2. 商品條碼 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.stepNum}>2</div>
            <h2>商品資訊</h2>
          </div>
          <div className={styles.field}>
            <label>商品條碼<span className={styles.req}>*</span></label>
            <div className={styles.barcodeRow}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="輸入或掃描條碼"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
              />
              <button className={styles.scanBtn} onClick={() => setShowScanner(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <line x1="7" y1="8" x2="7" y2="16"/>
                  <line x1="10" y1="8" x2="10" y2="16"/>
                  <line x1="13" y1="8" x2="13" y2="12"/>
                  <line x1="16" y1="8" x2="16" y2="16"/>
                  <line x1="19" y1="12" x2="19" y2="16"/>
                </svg>
                掃描
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label>瑕疵數量（件）<span className={styles.req}>*</span></label>
            <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} style={{width: '130px'}} />
          </div>
        </div>

        {/* 3. 瑕疵描述 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.stepNum}>3</div>
            <h2>瑕疵描述</h2>
          </div>
          <div className={styles.field}>
            <label>瑕疵類型<span className={styles.req}>*</span></label>
            <div className={styles.typeGrid}>
              {DEFECT_TYPES.map(t => (
                <button
                  key={t}
                  className={`${styles.typeBtn} ${defectType === t ? styles.typeBtnActive : ''}`}
                  onClick={() => setDefectType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label>瑕疵說明<span className={styles.req}>*</span></label>
            <textarea
              placeholder="請詳述瑕疵狀況、位置…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
        </div>

        {/* 4. 照片/影片 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.stepNum}>4</div>
            <h2>照片 / 影片<span className={styles.subLabel}>至少 1 張</span></h2>
          </div>
          {(imgCount < 6 || vidCount < 1) && (
            <div className={styles.uploadZone} onClick={() => fileInputRef.current.click()}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p>點擊上傳照片或影片</p>
              <small>照片最多 6 張 · 影片最多 1 支（100MB）</small>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{display: 'none'}}
            onChange={e => handleFiles(e.target.files)}
          />
          {mediaFiles.length > 0 && (
            <div className={styles.mediaGrid}>
              {mediaFiles.map((m, i) => (
                <div key={i} className={styles.mediaThumb}>
                  {m.isVideo
                    ? <video src={m.src} muted playsInline />
                    : <img src={m.src} alt={`照片${i+1}`} />
                  }
                  {m.isVideo && <span className={styles.mediaBadge}>影片</span>}
                  <button className={styles.mediaRm} onClick={() => removeMedia(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
          {mediaFiles.length > 0 && (
            <div className={styles.mediaCount}>
              {imgCount > 0 ? `照片 ${imgCount} / 6 張` : ''}
              {imgCount > 0 && vidCount > 0 ? '　' : ''}
              {vidCount > 0 ? `影片 ${vidCount} / 1 支` : ''}
            </div>
          )}
        </div>

        {/* 5. 調撥單號 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.stepNum}>5</div>
            <h2>調撥單號<span className={styles.transferBadge}>AS08 → 延平倉</span></h2>
          </div>
          <div className={styles.field}>
            <label>瑕疵單調撥單號<span className={styles.req}>*</span></label>
            <input
              type="text"
              placeholder="例：TR-20240513-001"
              value={transferNo}
              onChange={e => setTransferNo(e.target.value)}
              style={{fontFamily: 'monospace', letterSpacing: '0.04em'}}
            />
          </div>
          <div className={styles.field}>
            <label>備註</label>
            <input type="text" placeholder="選填" value={transferNote} onChange={e => setTransferNote(e.target.value)} />
          </div>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}
      </div>

      <div className={styles.submitBar}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '上傳中…' : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              提交通報並上傳
            </>
          )}
        </button>
        {submitting && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{width: `${progress}%`}} />
          </div>
        )}
      </div>
    </>
  )
}
