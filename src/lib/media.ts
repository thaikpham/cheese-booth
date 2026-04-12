import type { TransformSettings } from '../types'

const PHOTO_LANDSCAPE_RATIO = 4 / 3
const PHOTO_PORTRAIT_RATIO = 3 / 4
const BOOMERANG_DURATION_MS = 3_000
const BOOMERANG_FPS = 15
const BOOMERANG_MAX_LONG_EDGE = 1920

export interface RenderedCapture {
  blob: Blob
  width: number
  height: number
  mimeType: string
  extension: string
}

type SampledFrame = CanvasImageSource & {
  close?: () => void
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Không thể tạo blob từ canvas.'))
      },
      type,
      quality,
    )
  })
}

export function normalizeRotationQuarter(rotationQuarter: number): 0 | 1 | 2 | 3 {
  const normalized = ((rotationQuarter % 4) + 4) % 4

  if (normalized === 1 || normalized === 2 || normalized === 3) {
    return normalized
  }

  return 0
}

function isPortraitRotation(rotationQuarter: number): boolean {
  return normalizeRotationQuarter(rotationQuarter) % 2 === 1
}

export function getOutputAspectRatio(rotationQuarter: number): number {
  return isPortraitRotation(rotationQuarter)
    ? PHOTO_PORTRAIT_RATIO
    : PHOTO_LANDSCAPE_RATIO
}

export function getLargestAspectRect(
  sourceWidth: number,
  sourceHeight: number,
  rotationQuarter: number,
): { width: number; height: number } {
  const normalized = normalizeRotationQuarter(rotationQuarter)
  const rotatedWidth = normalized % 2 === 1 ? sourceHeight : sourceWidth
  const rotatedHeight = normalized % 2 === 1 ? sourceWidth : sourceHeight
  const targetRatio = getOutputAspectRatio(normalized)

  if (rotatedWidth / rotatedHeight > targetRatio) {
    return {
      width: Math.max(1, Math.round(rotatedHeight * targetRatio)),
      height: Math.max(1, Math.round(rotatedHeight)),
    }
  }

  return {
    width: Math.max(1, Math.round(rotatedWidth)),
    height: Math.max(1, Math.round(rotatedWidth / targetRatio)),
  }
}

function constrainLongEdge(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height)

  if (longEdge <= maxLongEdge) {
    return { width, height }
  }

  const scale = maxLongEdge / longEdge

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function getCenteredAspectCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  rotationQuarter: number,
): {
  sourceX: number
  sourceY: number
  sourceCropWidth: number
  sourceCropHeight: number
  rotatedCropWidth: number
  rotatedCropHeight: number
} {
  const normalized = normalizeRotationQuarter(rotationQuarter)
  const rotatedWidth = normalized % 2 === 1 ? sourceHeight : sourceWidth
  const rotatedHeight = normalized % 2 === 1 ? sourceWidth : sourceHeight
  const targetRatio = targetWidth / targetHeight

  let rotatedCropHeight = rotatedHeight
  let rotatedCropWidth = rotatedCropHeight * targetRatio

  // Prefer preserving the full sensor height and crop symmetrically from the sides.
  if (rotatedCropWidth > rotatedWidth) {
    rotatedCropWidth = rotatedWidth
    rotatedCropHeight = rotatedCropWidth / targetRatio
  }

  const sourceCropWidth =
    normalized % 2 === 1 ? rotatedCropHeight : rotatedCropWidth
  const sourceCropHeight =
    normalized % 2 === 1 ? rotatedCropWidth : rotatedCropHeight

  return {
    sourceX: Math.max(0, (sourceWidth - sourceCropWidth) / 2),
    sourceY: Math.max(0, (sourceHeight - sourceCropHeight) / 2),
    sourceCropWidth: Math.max(1, sourceCropWidth),
    sourceCropHeight: Math.max(1, sourceCropHeight),
    rotatedCropWidth: Math.max(1, rotatedCropWidth),
    rotatedCropHeight: Math.max(1, rotatedCropHeight),
  }
}

export function drawTransformedCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  transform: TransformSettings,
): void {
  const rotationQuarter = normalizeRotationQuarter(transform.rotationQuarter)
  const crop = getCenteredAspectCrop(
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    rotationQuarter,
  )
  const scale = Math.min(
    targetWidth / crop.rotatedCropWidth,
    targetHeight / crop.rotatedCropHeight,
  )
  const drawWidth = crop.sourceCropWidth * scale
  const drawHeight = crop.sourceCropHeight * scale

  const flipX = transform.flipHorizontal ? -1 : 1
  const flipY = transform.flipVertical ? -1 : 1

  ctx.clearRect(0, 0, targetWidth, targetHeight)
  ctx.fillStyle = '#0c0f14'
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  ctx.save()
  ctx.translate(targetWidth / 2, targetHeight / 2)
  ctx.rotate((rotationQuarter * Math.PI) / 2)
  ctx.scale(flipX, flipY)

  ctx.drawImage(
    source,
    crop.sourceX,
    crop.sourceY,
    crop.sourceCropWidth,
    crop.sourceCropHeight,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  )
  ctx.restore()
}

export async function renderPhotoFromVideo(
  video: HTMLVideoElement,
  transform: TransformSettings,
): Promise<RenderedCapture> {
  const output = getLargestAspectRect(
    video.videoWidth,
    video.videoHeight,
    transform.rotationQuarter,
  )
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Không thể khởi tạo canvas chụp ảnh.')
  }

  canvas.width = output.width
  canvas.height = output.height

  drawTransformedCover(
    ctx,
    video,
    video.videoWidth,
    video.videoHeight,
    output.width,
    output.height,
    transform,
  )

  const blob = await toBlob(canvas, 'image/jpeg', 1.0)

  return {
    blob,
    width: output.width,
    height: output.height,
    mimeType: 'image/jpeg',
    extension: 'jpg',
  }
}

function pickRecorderMimeType(): { mimeType: string; extension: string } {
  const candidates = [
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
    { mimeType: 'video/mp4', extension: 'mp4' },
  ]

  for (const candidate of candidates) {
    if (
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported(candidate.mimeType)
    ) {
      return candidate
    }
  }

  return {
    mimeType: '',
    extension: 'webm',
  }
}

async function cloneSampleFrame(canvas: HTMLCanvasElement): Promise<SampledFrame> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(canvas)
  }

  const clonedCanvas = document.createElement('canvas')
  const clonedContext = clonedCanvas.getContext('2d')

  if (!clonedContext) {
    throw new Error('Không thể sao chép frame boomerang.')
  }

  clonedCanvas.width = canvas.width
  clonedCanvas.height = canvas.height
  clonedContext.drawImage(canvas, 0, 0)

  return clonedCanvas
}

export async function renderBoomerangFromVideo(
  video: HTMLVideoElement,
  transform: TransformSettings,
): Promise<RenderedCapture> {
  const baseOutput = getLargestAspectRect(
    video.videoWidth,
    video.videoHeight,
    transform.rotationQuarter,
  )
  const output = constrainLongEdge(
    baseOutput.width,
    baseOutput.height,
    BOOMERANG_MAX_LONG_EDGE,
  )
  const sampleCanvas = document.createElement('canvas')
  const sampleContext = sampleCanvas.getContext('2d')

  if (!sampleContext) {
    throw new Error('Không thể khởi tạo canvas boomerang.')
  }

  sampleCanvas.width = output.width
  sampleCanvas.height = output.height

  const sampledFrames: SampledFrame[] = []
  const frameInterval = 1000 / BOOMERANG_FPS
  const totalFrames = Math.max(1, Math.round(BOOMERANG_DURATION_MS / frameInterval))
  const sampleStart = performance.now()

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
    const nextDeadline = sampleStart + frameIndex * frameInterval
    const delay = nextDeadline - performance.now()

    if (delay > 0) {
      await wait(delay)
    }

    drawTransformedCover(
      sampleContext,
      video,
      video.videoWidth,
      video.videoHeight,
      output.width,
      output.height,
      transform,
    )

    sampledFrames.push(await cloneSampleFrame(sampleCanvas))
  }

  if (sampledFrames.length === 0) {
    throw new Error('Không lấy được frame nào cho boomerang.')
  }

  const sequence = sampledFrames.concat(sampledFrames.slice(1, -1).reverse())
  const playbackCanvas = document.createElement('canvas')
  const playbackContext = playbackCanvas.getContext('2d')

  if (!playbackContext) {
    sampledFrames.forEach((frame) => frame.close?.())
    throw new Error('Không thể khởi tạo canvas xuất boomerang.')
  }

  playbackCanvas.width = output.width
  playbackCanvas.height = output.height

  if (typeof playbackCanvas.captureStream !== 'function') {
    sampledFrames.forEach((frame) => frame.close?.())
    throw new Error('Runtime hiện tại chưa hỗ trợ ghi boomerang.')
  }

  if (typeof MediaRecorder === 'undefined') {
    sampledFrames.forEach((frame) => frame.close?.())
    throw new Error('Runtime hiện tại chưa hỗ trợ ghi boomerang.')
  }

  const stream = playbackCanvas.captureStream(BOOMERANG_FPS)
  const { mimeType, extension } = pickRecorderMimeType()

  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 })
    : new MediaRecorder(stream, { videoBitsPerSecond: 8000000 })

  const chunks: Blob[] = []
  const finishedBlob = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onstop = () => {
      resolve(
        new Blob(chunks, {
          type: recorder.mimeType || mimeType || 'video/webm',
        }),
      )
    }
  })

  recorder.start(frameInterval)

  for (const frame of sequence) {
    playbackContext.clearRect(0, 0, output.width, output.height)
    playbackContext.drawImage(frame, 0, 0, output.width, output.height)
    await wait(frameInterval)
  }

  await wait(frameInterval)
  recorder.stop()

  const [track] = stream.getTracks()

  if (track) {
    track.stop()
  }

  const blob = await finishedBlob

  sampledFrames.forEach((frame) => frame.close?.())

  return {
    blob,
    width: output.width,
    height: output.height,
    mimeType: blob.type || recorder.mimeType || mimeType || 'video/webm',
    extension,
  }
}
