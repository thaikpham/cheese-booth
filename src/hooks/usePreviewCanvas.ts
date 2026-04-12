import { useEffect, type RefObject } from 'react'

import { drawTransformedCover, getLargestAspectRect } from '../lib/media'
import type { OperatorSettings } from '../types'

interface UsePreviewCanvasOptions {
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  videoRef: RefObject<HTMLVideoElement | null>
  settings: Pick<
    OperatorSettings,
    'rotationQuarter' | 'flipHorizontal' | 'flipVertical'
  >
}

export function usePreviewCanvas({
  previewFrameRef,
  previewCanvasRef,
  videoRef,
  settings,
}: UsePreviewCanvasOptions): void {
  const { flipHorizontal, flipVertical, rotationQuarter } = settings

  useEffect(() => {
    const previewFrame = previewFrameRef.current
    const previewCanvas = previewCanvasRef.current

    if (!previewFrame || !previewCanvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const canvas = previewCanvasRef.current

      if (!entry || !canvas) return

      const dpr = window.devicePixelRatio || 1
      const width = Math.max(1, Math.round(entry.contentRect.width * dpr))
      const height = Math.max(1, Math.round(entry.contentRect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    })

    resizeObserver.observe(previewFrame)

    return () => {
      resizeObserver.disconnect()
    }
  }, [previewCanvasRef, previewFrameRef])

  useEffect(() => {
    let frameId = 0
    const scratchCanvas = document.createElement('canvas')
    const scratchContext = scratchCanvas.getContext('2d')

    const drawLoop = () => {
      const canvas = previewCanvasRef.current
      const video = videoRef.current

      if (canvas) {
        const context = canvas.getContext('2d')

        if (context) {
          if (video && video.readyState >= 2) {
            const output = getLargestAspectRect(
              video.videoWidth,
              video.videoHeight,
              rotationQuarter,
            )

            if (scratchContext) {
              if (
                scratchCanvas.width !== output.width ||
                scratchCanvas.height !== output.height
              ) {
                scratchCanvas.width = output.width
                scratchCanvas.height = output.height
              }

              drawTransformedCover(
                scratchContext,
                video,
                video.videoWidth,
                video.videoHeight,
                output.width,
                output.height,
                {
                  rotationQuarter,
                  flipHorizontal,
                  flipVertical,
                },
              )

              context.clearRect(0, 0, canvas.width, canvas.height)
              context.drawImage(
                scratchCanvas,
                0,
                0,
                scratchCanvas.width,
                scratchCanvas.height,
                0,
                0,
                canvas.width,
                canvas.height,
              )
            }
          } else {
            context.clearRect(0, 0, canvas.width, canvas.height)
            context.fillStyle = '#0c0f14'
            context.fillRect(0, 0, canvas.width, canvas.height)
          }
        }
      }

      frameId = window.requestAnimationFrame(drawLoop)
    }

    frameId = window.requestAnimationFrame(drawLoop)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [
    previewCanvasRef,
    flipHorizontal,
    flipVertical,
    rotationQuarter,
    videoRef,
  ])
}
