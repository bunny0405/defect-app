'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './BarcodeScanner.module.css'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef()
  const [status, setStatus] = useState('啟動相機中…')
  const [stream, setStream] = useState(null)
  const animRef = useRef()

  useEffect(() => {
    let localStream = null

    const start = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        setStream(localStream)
        videoRef.current.srcObject = localStream
        await videoRef.current.play()

        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          setStatus('對準條碼…')
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
          })
          const detect = async () => {
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0) {
                onDetected(codes[0].rawValue)
                return
              }
            } catch (_) {}
            animRef.current = requestAnimationFrame(detect)
          }
          animRef.current = requestAnimationFrame(detect)
        } else {
          // fallback: ZXing
          setStatus('載入掃描模組…')
          const { BrowserMultiFormatReader } = await import('@zxing/library')
          const reader = new BrowserMultiFormatReader()
          setStatus('對準條碼…')
          const canvas = document.createElement('canvas')
          const scan = async () => {
            if (!videoRef.current) return
            if (videoRef.current.readyState < 2) {
              animRef.current = requestAnimationFrame(scan)
              return
            }
            canvas.width = videoRef.current.videoWidth || 640
            canvas.height = videoRef.current.videoHeight || 480
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            try {
              const result = await reader.decodeFromCanvas(canvas)
              if (result) {
                onDetected(result.getText())
                return
              }
            } catch (_) {}
            animRef.current = requestAnimationFrame(scan)
          }
          animRef.current = requestAnimationFrame(scan)
        }
      } catch (err) {
        setStatus('無法開啟相機：' + err.message)
      }
    }

    start()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (localStream) localStream.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleClose = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (stream) stream.getTracks().forEach(t => t.stop())
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.title}>掃描條碼</span>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
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
        <button className={styles.cancelBtn} onClick={handleClose}>取消</button>
      </div>
    </div>
  )
}
