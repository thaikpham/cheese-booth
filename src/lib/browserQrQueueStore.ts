import type { BrowserQrQueueItem, CaptureMode } from '../types'

const DB_NAME = 'kiosk-browser-qr-queue'
const DB_VERSION = 1
const ITEM_STORE = 'items'
const PAYLOAD_STORE = 'payloads'

export const MAX_BROWSER_QR_QUEUE_ITEMS = 100

export interface BrowserQrQueuePayloadRecord {
  id: string
  kind: CaptureMode
  blob: Blob
  mimeType: string
  extension: string
  width: number
  height: number
}

export type BrowserQrQueuePayloadInput = Omit<BrowserQrQueuePayloadRecord, 'id'>

export interface BrowserQrQueueTrimResult {
  items: BrowserQrQueueItem[]
  evictedIds: string[]
}

let openDatabasePromise: Promise<IDBDatabase> | null = null

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request thất bại.'))
    }
  })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve()
    }
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction thất bại.'))
    }
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction đã bị hủy.'))
    }
  })
}

function sortBrowserQrQueueItems(items: BrowserQrQueueItem[]): BrowserQrQueueItem[] {
  return [...items].sort((left, right) => right.createdAt - left.createdAt)
}

async function openBrowserQrQueueDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB không khả dụng trên runtime hiện tại.')
  }

  openDatabasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(ITEM_STORE)) {
        database.createObjectStore(ITEM_STORE, { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains(PAYLOAD_STORE)) {
        database.createObjectStore(PAYLOAD_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      openDatabasePromise = null
      reject(request.error ?? new Error('Không thể mở IndexedDB cho QR queue.'))
    }
  })

  return openDatabasePromise
}

export async function readAllBrowserQrQueueItems(): Promise<BrowserQrQueueItem[]> {
  const database = await openBrowserQrQueueDatabase()
  const transaction = database.transaction(ITEM_STORE, 'readonly')
  const store = transaction.objectStore(ITEM_STORE)
  const items = await requestToPromise(store.getAll() as IDBRequest<BrowserQrQueueItem[]>)

  await transactionToPromise(transaction)

  return sortBrowserQrQueueItems(items)
}

export async function persistBrowserQrQueueItem(
  item: BrowserQrQueueItem,
): Promise<void> {
  const database = await openBrowserQrQueueDatabase()
  const transaction = database.transaction(ITEM_STORE, 'readwrite')

  transaction.objectStore(ITEM_STORE).put(item)

  await transactionToPromise(transaction)
}

export async function persistBrowserQrQueueEntry(
  item: BrowserQrQueueItem,
  payload: BrowserQrQueuePayloadInput,
): Promise<void> {
  const database = await openBrowserQrQueueDatabase()
  const transaction = database.transaction([ITEM_STORE, PAYLOAD_STORE], 'readwrite')

  transaction.objectStore(ITEM_STORE).put(item)
  transaction.objectStore(PAYLOAD_STORE).put({
    id: item.id,
    ...payload,
  } satisfies BrowserQrQueuePayloadRecord)

  await transactionToPromise(transaction)
}

export async function readBrowserQrQueuePayload(
  id: string,
): Promise<BrowserQrQueuePayloadRecord | null> {
  const database = await openBrowserQrQueueDatabase()
  const transaction = database.transaction(PAYLOAD_STORE, 'readonly')
  const store = transaction.objectStore(PAYLOAD_STORE)
  const payload = await requestToPromise(
    store.get(id) as IDBRequest<BrowserQrQueuePayloadRecord | undefined>,
  )

  await transactionToPromise(transaction)

  return payload ?? null
}

export async function deleteBrowserQrQueuePayload(id: string): Promise<void> {
  const database = await openBrowserQrQueueDatabase()
  const transaction = database.transaction(PAYLOAD_STORE, 'readwrite')

  transaction.objectStore(PAYLOAD_STORE).delete(id)

  await transactionToPromise(transaction)
}

export async function deleteBrowserQrQueueEntries(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return
  }

  const database = await openBrowserQrQueueDatabase()
  const transaction = database.transaction([ITEM_STORE, PAYLOAD_STORE], 'readwrite')
  const itemStore = transaction.objectStore(ITEM_STORE)
  const payloadStore = transaction.objectStore(PAYLOAD_STORE)

  ids.forEach((id) => {
    itemStore.delete(id)
    payloadStore.delete(id)
  })

  await transactionToPromise(transaction)
}

export async function trimBrowserQrQueue(
  limit = MAX_BROWSER_QR_QUEUE_ITEMS,
): Promise<BrowserQrQueueTrimResult> {
  const items = await readAllBrowserQrQueueItems()

  if (items.length <= limit) {
    return {
      items,
      evictedIds: [],
    }
  }

  const keptItems = items.slice(0, limit)
  const evictedIds = items.slice(limit).map((item) => item.id)

  await deleteBrowserQrQueueEntries(evictedIds)

  return {
    items: keptItems,
    evictedIds,
  }
}
