import { useCallback, useMemo, useRef, useState } from "react"

export interface Pixel {
  x: number
  y: number
  color: string
}

export type PixelMap = Map<string, string>

export interface PendingStamp {
  pixels: PixelMap
  width: number
  height: number
}

interface HistoryEntry {
  key: string
  prevColor: string | null
  newColor: string | null
}

interface PiskelFile {
  modelVersion: number
  piskel: {
    name: string
    width: number
    height: number
    layers: string[]
  }
}

interface PiskelLayer {
  name: string
  opacity: number
  frameCount: number
  chunks: {
    layout: number[][]
    base64PNG: string
  }[]
}

const GRID_SIZE = 100
const MAX_PIXELS = 22500

function pixelKey(x: number, y: number): string {
  return `${x},${y}`
}

function rgbaToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  )
}

function loadImagePixels(base64PNG: string): Promise<PixelMap> {
  return new Promise((resolve) => {
    const pixels: PixelMap = new Map()
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const data = imageData.data

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          if (a > 0) {
            pixels.set(pixelKey(x, y), rgbaToHex(r, g, b))
          }
        }
      }
      resolve(pixels)
    }
    img.onerror = () => resolve(pixels)
    img.src = base64PNG
  })
}

export function usePixelCanvas() {
  const [pixels, setPixels] = useState<PixelMap>(new Map())
  const [selectedColor, setSelectedColor] = useState("#ff6b6b")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<"draw" | "erase">("draw")
  const [pendingStamp, setPendingStamp] = useState<PendingStamp | null>(null)
  const [stampPosition, setStampPosition] = useState({ x: 0, y: 0 })

  const undoStack = useRef<HistoryEntry[]>([])
  const redoStack = useRef<HistoryEntry[]>([])
  const [historyVersion, setHistoryVersion] = useState(0)

  const pixelCount = pixels.size

  const drawPixel = useCallback(
    (x: number, y: number) => {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return

      const key = pixelKey(x, y)

      if (tool === "erase") {
        setPixels((prev) => {
          if (!prev.has(key)) return prev
          const next = new Map(prev)
          const prevColor = prev.get(key) ?? null
          next.delete(key)
          undoStack.current.push({ key, prevColor, newColor: null })
          redoStack.current = []
          return next
        })
        setHistoryVersion((v) => v + 1)
        return
      }

      setPixels((prev) => {
        if (prev.get(key) === selectedColor) return prev
        if (!prev.has(key) && prev.size >= MAX_PIXELS) return prev

        const next = new Map(prev)
        const prevColor = prev.get(key) ?? null
        next.set(key, selectedColor)
        undoStack.current.push({ key, prevColor, newColor: selectedColor })
        redoStack.current = []
        return next
      })
      setHistoryVersion((v) => v + 1)
    },
    [selectedColor, tool],
  )

  const undo = useCallback(() => {
    const entry = undoStack.current.pop()
    if (!entry) return

    setPixels((prev) => {
      const next = new Map(prev)
      if (entry.prevColor === null) {
        next.delete(entry.key)
      } else {
        next.set(entry.key, entry.prevColor)
      }
      redoStack.current.push(entry)
      return next
    })
    setHistoryVersion((v) => v + 1)
  }, [])

  const redo = useCallback(() => {
    const entry = redoStack.current.pop()
    if (!entry) return

    setPixels((prev) => {
      const next = new Map(prev)
      if (entry.newColor === null) {
        next.delete(entry.key)
      } else {
        next.set(entry.key, entry.newColor)
      }
      undoStack.current.push(entry)
      return next
    })
    setHistoryVersion((v) => v + 1)
  }, [])

  const canUndo = useMemo(
    () => undoStack.current.length > 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyVersion],
  )
  const canRedo = useMemo(
    () => redoStack.current.length > 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyVersion],
  )

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.3, 5))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.3, 0.5))
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const panBy = useCallback((dx: number, dy: number) => {
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }, [])

  const savePixels = useCallback(() => {
    const data: Pixel[] = []
    pixels.forEach((color, key) => {
      const [x, y] = key.split(",").map(Number)
      data.push({ x, y, color })
    })
    return data
  }, [pixels])

  const exportAsJSON = useCallback(() => {
    const data = savePixels()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pixel-art.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [savePixels])

  const clearCanvas = useCallback(() => {
    if (pixels.size === 0) return
    pixels.forEach((color, key) => {
      undoStack.current.push({ key, prevColor: color, newColor: null })
    })
    redoStack.current = []
    setPixels(new Map())
    setHistoryVersion((v) => v + 1)
  }, [pixels])

  const stampPixelCost = useMemo(() => {
    if (!pendingStamp) return 0
    let cost = 0
    pendingStamp.pixels.forEach((_color, key) => {
      const [rx, ry] = key.split(",").map(Number)
      const ax = rx + stampPosition.x
      const ay = ry + stampPosition.y
      if (ax >= 0 && ax < GRID_SIZE && ay >= 0 && ay < GRID_SIZE) {
        if (!pixels.has(pixelKey(ax, ay))) cost++
      }
    })
    return cost
  }, [pendingStamp, stampPosition, pixels])

  const loadAsStamp = useCallback(async (url: string) => {
    const response = await fetch(url)
    const piskelJson: PiskelFile = await response.json()
    const layer: PiskelLayer = JSON.parse(piskelJson.piskel.layers[0])
    const chunk = layer.chunks[0]
    if (!chunk) return

    const loadedPixels = await loadImagePixels(chunk.base64PNG)
    const w = piskelJson.piskel.width
    const h = piskelJson.piskel.height

    setPendingStamp({ pixels: loadedPixels, width: w, height: h })
    setStampPosition({
      x: Math.floor((GRID_SIZE - w) / 2),
      y: Math.floor((GRID_SIZE - h) / 2),
    })
  }, [])

  const moveStamp = useCallback((x: number, y: number) => {
    setStampPosition({ x, y })
  }, [])

  const commitStamp = useCallback(() => {
    if (!pendingStamp) return
    const entries: HistoryEntry[] = []

    setPixels((prev) => {
      const next = new Map(prev)
      pendingStamp.pixels.forEach((color, key) => {
        const [rx, ry] = key.split(",").map(Number)
        const ax = rx + stampPosition.x
        const ay = ry + stampPosition.y
        if (ax < 0 || ax >= GRID_SIZE || ay < 0 || ay >= GRID_SIZE) return

        const absKey = pixelKey(ax, ay)
        if (!next.has(absKey) && next.size >= MAX_PIXELS) return

        const prevColor = next.get(absKey) ?? null
        next.set(absKey, color)
        entries.push({ key: absKey, prevColor, newColor: color })
      })
      undoStack.current.push(...entries)
      redoStack.current = []
      return next
    })

    setPendingStamp(null)
    setHistoryVersion((v) => v + 1)
  }, [pendingStamp, stampPosition])

  const cancelStamp = useCallback(() => {
    setPendingStamp(null)
  }, [])

  const loadFromPiskel = useCallback(async (url: string) => {
    const response = await fetch(url)
    const piskelJson: PiskelFile = await response.json()
    const layer: PiskelLayer = JSON.parse(piskelJson.piskel.layers[0])
    const chunk = layer.chunks[0]
    if (!chunk) return

    const loadedPixels = await loadImagePixels(chunk.base64PNG)

    undoStack.current = []
    redoStack.current = []
    setPixels(loadedPixels)
    setHistoryVersion((v) => v + 1)
  }, [])

  return {
    pixels,
    selectedColor,
    setSelectedColor,
    zoom,
    pan,
    setPan,
    tool,
    setTool,
    drawPixel,
    undo,
    redo,
    canUndo,
    canRedo,
    zoomIn,
    zoomOut,
    resetView,
    pixelCount,
    maxPixels: MAX_PIXELS,
    gridSize: GRID_SIZE,
    savePixels,
    exportAsJSON,
    clearCanvas,
    loadFromPiskel,
    panBy,
    historyVersion,
    pendingStamp,
    stampPosition,
    stampPixelCost,
    loadAsStamp,
    moveStamp,
    commitStamp,
    cancelStamp,
  }
}
