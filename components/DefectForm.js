'use client'
import { useState, useRef, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner'
import styles from './DefectForm.module.css'

const STORES = ['AS62 南西IP店', 'AS70 西門IP店']
const DEFECT_TYPES = ['進貨損壞', '陳列耗損']
const SCRIPT_URL = 'https://script.google.com/a/macros/airspaceonline.com/s/AKfycbxMEksqqYseXlaLKYMomV20fgtk9DGCKO_RA9QyCcMVBhVNhUx-5522-ySlCQgifKDPCA/exec'

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
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
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
    if (!barcode)
