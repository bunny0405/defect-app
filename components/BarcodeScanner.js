'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './BarcodeScanner.module.css'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('啟動相機中…')
  const streamRef = useRef(null)
  const readerRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    let stopped = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus('載入掃描模組…')

        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/library')
        if (stopped) return
        
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader
        setStatus('對準條碼…')

        const canvas = document.createElement('canvas')
        const scan = async () => {
          if (stopped || !videoRef.current) return
          if (videoRef.current.readyState < 2) {
            animRef.current = requestAnimationFrame(scan)
            return
          }
          canvas.width = videoRef.current.videoWidth || 640
          canvas.height = videoRef.current.videoHeight || 480
          canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
          try {
            const result = await reader.decodeFromCanvas(canvas)
            if (result && !stopped) {
              onDetected(result.getText())
              return
            }
          } catch (e) {
            if (!(e instanceof NotFoundException)) console.error(e)
          }
          animRef.current = requestAnimationFrame(scan)
        }
        animRef.current = requestAnimationFrame(scan)

      } catch (err) {
        setStatus('無法開啟相機：' + err.message)
      }
    }

    start()

    return () => {
      stopped = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.title}>掃描條碼</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.videoWrap}>
          <video ref={videoRef} className={styles.video} playsInline muted autoPlay />
          <div className={styles.scanFrame}>
            <div className={styles.corner} data-pos="tl" />
            <div className={styles.corner} data-pos="tr" />
            <div className={styles.corner} data-pos="bl" />
            <div className={styles.corner} data-pos="br" />
            <div className={styles.scanLine} />
          </div>
        </div>
        <div className={styles.hint}>{status}</div>
        <button className={styles.cancelBtn} onClick={onClose}>取消</button>
      </div>
    </div>
  )
}
