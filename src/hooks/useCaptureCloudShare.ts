import { useEffect, useRef, useState } from 'react'

import {
  MAX_BROWSER_QR_QUEUE_ITEMS,
  deleteBrowserQrQueueEntries,
  deleteBrowserQrQueuePayload,
  persistBrowserQrQueueEntry,
  persistBrowserQrQueueItem,
  readAllBrowserQrQueueItems,
  readBrowserQrQueuePayload,
  trimBrowserQrQueue,
  type BrowserQrQueuePayloadInput,
} from '../lib/browserQrQueueStore'
import {
  completeCloudCaptureShare,
  initCloudCaptureShare,
  uploadCaptureToSignedUrl,
} from '../lib/cloudShare'
import type { RenderedCapture } from '../lib/media'
import type { BrowserQrQueueItem, CaptureMode } from '../types'

export const BROWSER_CLOUD_STORAGE_LABEL = 'Cloudflare R2 private bucket'
export const BROWSER_CLOUD_STORAGE_REVIEW_LABEL =
  `${BROWSER_CLOUD_STORAGE_LABEL} · chờ xác nhận upload`

const MAX_CONCURRENT_UPLOADS = 2
const QR_QUEUE_HUE_STEP = 37
const QR_QUEUE_COMPLEMENTARY_SHIFT = 180
const QR_QUEUE_ACCENT_SATURATION = 88
const QR_QUEUE_ACCENT_LIGHTNESS = 64

export interface PendingCloudShareUpload extends RenderedCapture {
  kind: CaptureMode
}

interface UseCaptureCloudShareResult {
  browserQrQueue: BrowserQrQueueItem[]
  resetStagedBrowserCloudShare: () => void
  stageBrowserCloudShare: (payload: PendingCloudShareUpload) => void
  approveBrowserCloudShare: () => boolean
  retryBrowserQrQueueItem: (id: string) => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function sortBrowserQrQueue(items: BrowserQrQueueItem[]): BrowserQrQueueItem[] {
  return [...items].sort((left, right) => right.createdAt - left.createdAt)
}

function toPayloadInput(
  payload: PendingCloudShareUpload,
): BrowserQrQueuePayloadInput {
  return {
    kind: payload.kind,
    blob: payload.blob,
    mimeType: payload.mimeType,
    extension: payload.extension,
    width: payload.width,
    height: payload.height,
  }
}

function toPendingUpload(
  payload: BrowserQrQueuePayloadInput,
): PendingCloudShareUpload {
  return {
    kind: payload.kind,
    blob: payload.blob,
    mimeType: payload.mimeType,
    extension: payload.extension,
    width: payload.width,
    height: payload.height,
  }
}

function toHslAccentColor(hue: number): string {
  return `hsl(${Math.round(hue)} ${QR_QUEUE_ACCENT_SATURATION}% ${QR_QUEUE_ACCENT_LIGHTNESS}%)`
}

export function useCaptureCloudShare(): UseCaptureCloudShareResult {
  const [browserQrQueue, setBrowserQrQueue] = useState<BrowserQrQueueItem[]>([])
  const browserQrQueueRef = useRef<BrowserQrQueueItem[]>([])
  const accentSequenceSeedRef = useRef(Math.floor(Math.random() * 360))
  const accentSequenceIndexRef = useRef(0)
  const stagedBrowserShareRef = useRef<PendingCloudShareUpload | null>(null)
  const queuedJobIdsRef = useRef<string[]>([])
  const activeJobsRef = useRef(new Map<string, AbortController>())
  const payloadCacheRef = useRef(new Map<string, PendingCloudShareUpload>())
  const disposedRef = useRef(false)

  function warnStoreError(scope: string, error: unknown): void {
    console.warn(`Khong the ${scope} trong browser QR queue.`, error)
  }

  function replaceBrowserQrQueue(items: BrowserQrQueueItem[]): void {
    if (disposedRef.current) {
      return
    }

    const sortedItems = sortBrowserQrQueue(items).slice(
      0,
      MAX_BROWSER_QR_QUEUE_ITEMS,
    )

    browserQrQueueRef.current = sortedItems
    setBrowserQrQueue(sortedItems)
  }

  function removeQueuedJobIds(ids: string[]): void {
    if (ids.length === 0) {
      return
    }

    queuedJobIdsRef.current = queuedJobIdsRef.current.filter(
      (queuedId) => !ids.includes(queuedId),
    )
  }

  function cleanupEvictedQueueIds(ids: string[]): void {
    if (ids.length === 0) {
      return
    }

    removeQueuedJobIds(ids)

    ids.forEach((id) => {
      payloadCacheRef.current.delete(id)
      const controller = activeJobsRef.current.get(id)

      if (controller) {
        controller.abort()
        activeJobsRef.current.delete(id)
      }
    })

    void deleteBrowserQrQueueEntries(ids).catch((error) => {
      warnStoreError('xoa item QR queue da bi trim', error)
    })
  }

  function upsertBrowserQrQueueItem(item: BrowserQrQueueItem): void {
    const mergedItems = sortBrowserQrQueue([
      item,
      ...browserQrQueueRef.current.filter((currentItem) => currentItem.id !== item.id),
    ])
    const nextItems = mergedItems.slice(0, MAX_BROWSER_QR_QUEUE_ITEMS)
    const evictedIds = mergedItems
      .slice(MAX_BROWSER_QR_QUEUE_ITEMS)
      .map((currentItem) => currentItem.id)

    replaceBrowserQrQueue(nextItems)
    cleanupEvictedQueueIds(evictedIds)
  }

  function getBrowserQrQueueItem(id: string): BrowserQrQueueItem | null {
    return browserQrQueueRef.current.find((item) => item.id === id) ?? null
  }

  function getNextBrowserQrQueueAccentColor(): string {
    const sequenceIndex = accentSequenceIndexRef.current
    const pairIndex = Math.floor(sequenceIndex / 2)
    const isComplementaryStep = sequenceIndex % 2 === 1
    const hue =
      accentSequenceSeedRef.current +
      pairIndex * QR_QUEUE_HUE_STEP +
      (isComplementaryStep ? QR_QUEUE_COMPLEMENTARY_SHIFT : 0)

    accentSequenceIndexRef.current += 1

    return toHslAccentColor(((hue % 360) + 360) % 360)
  }

  async function loadPayloadForItem(
    id: string,
  ): Promise<PendingCloudShareUpload | null> {
    const cachedPayload = payloadCacheRef.current.get(id)

    if (cachedPayload) {
      return cachedPayload
    }

    try {
      const storedPayload = await readBrowserQrQueuePayload(id)

      if (!storedPayload) {
        return null
      }

      const payload = toPendingUpload(storedPayload)

      payloadCacheRef.current.set(id, payload)

      return payload
    } catch (error) {
      warnStoreError('doc payload QR queue', error)
      return null
    }
  }

  function enqueueBrowserQrQueueJob(id: string): void {
    if (disposedRef.current || activeJobsRef.current.has(id)) {
      return
    }

    if (!queuedJobIdsRef.current.includes(id)) {
      queuedJobIdsRef.current.push(id)
    }

    pumpBrowserQrQueue()
  }

  function markBrowserQrQueueItemGenerating(id: string): void {
    const currentItem = getBrowserQrQueueItem(id)

    if (!currentItem) {
      return
    }

    const nextItem: BrowserQrQueueItem = {
      ...currentItem,
      status: 'generating',
      errorMessage: undefined,
    }

    upsertBrowserQrQueueItem(nextItem)

    void persistBrowserQrQueueItem(nextItem).catch((error) => {
      warnStoreError('luu lai item dang tao QR', error)
    })
  }

  function markBrowserQrQueueItemError(id: string, errorMessage: string): void {
    const currentItem = getBrowserQrQueueItem(id)

    if (!currentItem) {
      return
    }

    const nextItem: BrowserQrQueueItem = {
      ...currentItem,
      status: 'error',
      errorMessage,
    }

    upsertBrowserQrQueueItem(nextItem)

    void persistBrowserQrQueueItem(nextItem).catch((error) => {
      warnStoreError('luu item loi QR queue', error)
    })
  }

  function markBrowserQrQueueItemReady(
    id: string,
    result: Pick<BrowserQrQueueItem, 'downloadUrl' | 'expiresAt'>,
  ): void {
    const currentItem = getBrowserQrQueueItem(id)

    if (!currentItem) {
      return
    }

    const nextItem: BrowserQrQueueItem = {
      ...currentItem,
      status: 'ready',
      downloadUrl: result.downloadUrl,
      expiresAt: result.expiresAt,
      errorMessage: undefined,
    }

    upsertBrowserQrQueueItem(nextItem)
    payloadCacheRef.current.delete(id)

    void Promise.all([
      persistBrowserQrQueueItem(nextItem),
      deleteBrowserQrQueuePayload(id),
    ]).catch((error) => {
      warnStoreError('cap nhat item QR queue thanh ready', error)
    })
  }

  async function runBrowserQrQueueJob(id: string): Promise<void> {
    const queueItem = getBrowserQrQueueItem(id)

    if (!queueItem || queueItem.status !== 'generating') {
      return
    }

    const payload = await loadPayloadForItem(id)

    if (!payload) {
      markBrowserQrQueueItemError(
        id,
        'Không còn media gốc để tiếp tục tạo QR. Hãy chụp lại nếu cần.',
      )
      return
    }

    const latestQueueItem = getBrowserQrQueueItem(id)

    if (!latestQueueItem || latestQueueItem.status !== 'generating') {
      return
    }

    const controller = new AbortController()

    activeJobsRef.current.set(id, controller)

    try {
      const init = await initCloudCaptureShare(
        {
          kind: payload.kind,
          mimeType: payload.mimeType,
          extension: payload.extension,
          byteSize: payload.blob.size,
          width: payload.width,
          height: payload.height,
        },
        controller.signal,
      )

      await uploadCaptureToSignedUrl(init.upload, payload.blob, controller.signal)

      const complete = await completeCloudCaptureShare(
        init.captureId,
        controller.signal,
      )

      if (controller.signal.aborted || disposedRef.current) {
        return
      }

      markBrowserQrQueueItemReady(id, {
        downloadUrl: complete.downloadUrl,
        expiresAt: complete.expiresAt,
      })
    } catch (error) {
      if (isAbortError(error) || disposedRef.current) {
        return
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể tạo link tải QR lúc này.'

      markBrowserQrQueueItemError(id, errorMessage)
    } finally {
      activeJobsRef.current.delete(id)

      if (!disposedRef.current) {
        pumpBrowserQrQueue()
      }
    }
  }

  function pumpBrowserQrQueue(): void {
    if (disposedRef.current) {
      return
    }

    while (
      activeJobsRef.current.size < MAX_CONCURRENT_UPLOADS &&
      queuedJobIdsRef.current.length > 0
    ) {
      const nextId = queuedJobIdsRef.current.shift()

      if (!nextId || activeJobsRef.current.has(nextId)) {
        continue
      }

      const queueItem = getBrowserQrQueueItem(nextId)

      if (!queueItem || queueItem.status !== 'generating') {
        continue
      }

      void runBrowserQrQueueJob(nextId)
    }
  }

  function resetStagedBrowserCloudShare(): void {
    stagedBrowserShareRef.current = null
  }

  function stageBrowserCloudShare(payload: PendingCloudShareUpload): void {
    stagedBrowserShareRef.current = payload
  }

  function approveBrowserCloudShare(): boolean {
    const payload = stagedBrowserShareRef.current

    if (!payload) {
      return false
    }

    stagedBrowserShareRef.current = null

    const queueItem: BrowserQrQueueItem = {
      id: crypto.randomUUID(),
      kind: payload.kind,
      createdAt: Date.now(),
      accentColor: getNextBrowserQrQueueAccentColor(),
      status: 'generating',
    }

    payloadCacheRef.current.set(queueItem.id, payload)
    upsertBrowserQrQueueItem(queueItem)

    void persistBrowserQrQueueEntry(queueItem, toPayloadInput(payload))
      .then(() => trimBrowserQrQueue())
      .then(({ evictedIds }) => {
        cleanupEvictedQueueIds(evictedIds)
      })
      .catch((error) => {
        warnStoreError('persist QR queue moi', error)
      })

    enqueueBrowserQrQueueJob(queueItem.id)

    return true
  }

  function retryBrowserQrQueueItem(id: string): void {
    const queueItem = getBrowserQrQueueItem(id)

    if (!queueItem || queueItem.status === 'ready') {
      return
    }

    markBrowserQrQueueItemGenerating(id)
    enqueueBrowserQrQueueJob(id)
  }

  const loadPayloadForItemRef = useRef(loadPayloadForItem)
  const markBrowserQrQueueItemErrorRef = useRef(markBrowserQrQueueItemError)
  const enqueueBrowserQrQueueJobRef = useRef(enqueueBrowserQrQueueJob)

  loadPayloadForItemRef.current = loadPayloadForItem
  markBrowserQrQueueItemErrorRef.current = markBrowserQrQueueItemError
  enqueueBrowserQrQueueJobRef.current = enqueueBrowserQrQueueJob

  useEffect(() => {
    let cancelled = false

    async function hydrateBrowserQrQueue(): Promise<void> {
      try {
        const storedItems = await readAllBrowserQrQueueItems()

        if (cancelled || disposedRef.current) {
          return
        }

        const nextItems = sortBrowserQrQueue(storedItems).slice(
          0,
          MAX_BROWSER_QR_QUEUE_ITEMS,
        )

        accentSequenceIndexRef.current = nextItems.length
        browserQrQueueRef.current = nextItems
        setBrowserQrQueue(nextItems)

        for (const item of nextItems) {
          if (item.status !== 'generating') {
            continue
          }

          const payload = await loadPayloadForItemRef.current(item.id)

          if (cancelled || disposedRef.current) {
            return
          }

          if (!payload) {
            markBrowserQrQueueItemErrorRef.current(
              item.id,
              'Không thể khôi phục media gốc sau khi tải lại. Hãy thử chụp lại.',
            )
            continue
          }

          enqueueBrowserQrQueueJobRef.current(item.id)
        }
      } catch (error) {
        warnStoreError('hydrate QR queue tu IndexedDB', error)
      }
    }

    void hydrateBrowserQrQueue()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const activeJobs = activeJobsRef.current

    return () => {
      const activeControllers = Array.from(activeJobs.values())

      disposedRef.current = true
      stagedBrowserShareRef.current = null
      queuedJobIdsRef.current = []

      activeControllers.forEach((controller) => {
        controller.abort()
      })
      activeJobs.clear()
    }
  }, [])

  return {
    browserQrQueue,
    resetStagedBrowserCloudShare,
    stageBrowserCloudShare,
    approveBrowserCloudShare,
    retryBrowserQrQueueItem,
  }
}
