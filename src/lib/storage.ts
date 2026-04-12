import { open } from '@tauri-apps/plugin-dialog'
import { mkdir, remove, writeFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

import type { CaptureMode } from '../types'
import { BROWSER_DOWNLOADS_LABEL, isTauriRuntime } from './runtime'

const DESKTOP_SAVE_REQUIRED_MESSAGE =
  'Lưu vào thư mục local chỉ hỗ trợ trong ứng dụng desktop Tauri. Nếu đang mở bằng trình duyệt, hãy chạy bản desktop.'
const OUTPUT_DIR_PROBE_PREFIX = '.cheese-booth-write-test-'

export async function verifyOutputDirectoryAccess(outputDir: string): Promise<void> {
  const normalized = outputDir.trim()

  if (!normalized) {
    throw new Error('Chưa chọn thư mục lưu media.')
  }

  if (!isTauriRuntime()) {
    return
  }

  const probePath = await join(
    normalized,
    `${OUTPUT_DIR_PROBE_PREFIX}${Date.now()}.tmp`,
  )
  const probeBytes = new TextEncoder().encode('cheese-booth-write-check')

  await writeFile(probePath, probeBytes)
  await remove(probePath)
}

export async function pickOutputDirectory(
  currentPath?: string | null,
): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw new Error(DESKTOP_SAVE_REQUIRED_MESSAGE)
  }

  const selected = await open({
    title: 'Chọn thư mục lưu media',
    directory: true,
    multiple: false,
    recursive: true,
    defaultPath: currentPath ?? undefined,
  })

  if (typeof selected !== 'string') {
    return null
  }

  await verifyOutputDirectoryAccess(selected)

  return selected
}

function formatDateFolder(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const millis = String(date.getMilliseconds()).padStart(3, '0')

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${millis}`
}

export async function saveCaptureToOutputDir(
  outputDir: string,
  kind: CaptureMode,
  blob: Blob,
  extension: string,
  createdAt: number,
): Promise<string> {
  const stamp = new Date(createdAt)
  const category = kind === 'photo' ? 'photos' : 'boomerangs'
  const fileName = `${kind}-${formatTimestamp(stamp)}.${extension}`

  if (!isTauriRuntime()) {
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = fileName
    link.style.display = 'none'
    document.body.append(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl)
    }, 1000)

    return `${BROWSER_DOWNLOADS_LABEL}/${fileName}`
  }

  const folder = await join(outputDir, category, formatDateFolder(stamp))

  await mkdir(folder, { recursive: true })

  const filePath = await join(folder, fileName)
  const bytes = new Uint8Array(await blob.arrayBuffer())

  await writeFile(filePath, bytes)

  return filePath
}
