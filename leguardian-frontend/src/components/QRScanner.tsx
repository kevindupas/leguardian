import React, { useRef, useEffect, useState } from 'react'
import jsQR from 'jsqr'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QRScannerProps {
  onScan: (code: string) => void
  onClose: () => void
  isScanning: boolean
}

export const QRScanner = ({ onScan, onClose, isScanning }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'checking' | 'granted' | 'denied'>('checking')
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isScanning) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      return
    }

    const startCamera = async () => {
      try {
        setError(null)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCameraPermission('granted')
        }
      } catch (err) {
        setCameraPermission('denied')
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to access camera. Please check permissions.'
        )
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isScanning])

  // Start scanning when video is ready
  useEffect(() => {
    if (!isScanning || cameraPermission !== 'granted' || !videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Wait for video to be loaded
    const handleLoadedMetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Start scanning interval
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }

      scanIntervalRef.current = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          })

          if (code) {
            onScan(code.data)
            // Clear interval after scan
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current)
              scanIntervalRef.current = null
            }
          }
        }
      }, 100)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [isScanning, cameraPermission, onScan])

  if (cameraPermission === 'denied') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Camera permission denied. Please enable camera access in your device settings to use QR scanning.
          </AlertDescription>
        </Alert>
        <Button onClick={onClose} variant="outline" className="w-full">
          Close
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-h-96">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Scanning guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden canvas for QR detection */}
      <canvas ref={canvasRef} className="hidden" />

      <p className="text-xs text-muted-foreground text-center">
        Point your camera at the QR code on your bracelet
      </p>
    </div>
  )
}
