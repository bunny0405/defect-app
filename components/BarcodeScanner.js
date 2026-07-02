'use client'
import { useEffect, useRef } from 'react'
import { useZxing } from 'react-zxing'
import styles from './BarcodeScanner.module.css'

export default function BarcodeScanner({ onDetected, onClose }) {
  const { ref } = useZxing({
    onDecodeResult(result) {
      onDetected(result.getText())
    },
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
  })

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.title}>掃描條碼</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.videoWrap}>
          <video ref={ref} className={styles.video} />
          <div className={styles.scanFrame}>
            <div className={styles.corner} data-pos="tl" />
            <div className={styles.corner} data-pos="tr" />
            <div className={styles.corner} data-pos="bl" />
            <div className={styles.corner} data-pos="br" />
            <div className={styles.scanLine} />
          </div>
        </div>
        <div className={styles.hint}>將條碼對準框內，自動辨識</div>
        <button className={styles.cancelBtn} onClick={onClose}>取消</button>
      </div>
    </div>
  )
}
