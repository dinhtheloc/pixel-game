import { useCallback, useEffect, useRef, useState } from "react"
import type { PixelMap } from "@/hooks/usePixelCanvas"

interface PixelCanvasProps {
  pixels: PixelMap
  gridSize: number
  zoom: number
  pan: { x: number; y: number }
  onDrawPixel: (x: number, y: number) => void
}

export default function PixelCanvas({
  pixels,
  gridSize,
  zoom,
  pan,
  onDrawPixel,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const lastDrawnCell = useRef<string | null>(null)

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = "#8b956d"
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    const cellSize =
      (Math.min(canvasSize.width, canvasSize.height) / gridSize) * zoom
    const offsetX = (canvasSize.width - cellSize * gridSize) / 2 + pan.x
    const offsetY = (canvasSize.height - cellSize * gridSize) / 2 + pan.y

    ctx.fillStyle = "#9ca882"
    ctx.fillRect(offsetX, offsetY, cellSize * gridSize, cellSize * gridSize)

    ctx.strokeStyle = "#8b956d"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(offsetX + i * cellSize, offsetY)
      ctx.lineTo(offsetX + i * cellSize, offsetY + gridSize * cellSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(offsetX, offsetY + i * cellSize)
      ctx.lineTo(offsetX + gridSize * cellSize, offsetY + i * cellSize)
      ctx.stroke()
    }

    pixels.forEach((color, key) => {
      const [x, y] = key.split(",").map(Number)
      ctx.fillStyle = color
      ctx.fillRect(
        offsetX + x * cellSize + 0.5,
        offsetY + y * cellSize + 0.5,
        cellSize - 1,
        cellSize - 1,
      )
    })

    ctx.strokeStyle = "#6b7353"
    ctx.lineWidth = 2
    ctx.strokeRect(offsetX, offsetY, cellSize * gridSize, cellSize * gridSize)
  }, [canvasSize, gridSize, zoom, pan, pixels])

  useEffect(() => {
    draw()
  }, [draw])

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top

      const cellSize =
        (Math.min(canvasSize.width, canvasSize.height) / gridSize) * zoom
      const offsetX = (canvasSize.width - cellSize * gridSize) / 2 + pan.x
      const offsetY = (canvasSize.height - cellSize * gridSize) / 2 + pan.y

      const x = Math.floor((px - offsetX) / cellSize)
      const y = Math.floor((py - offsetY) / cellSize)

      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null
      return { x, y }
    },
    [canvasSize, gridSize, zoom, pan],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      const cell = getCellFromPoint(e.clientX, e.clientY)
      if (cell) {
        isDrawing.current = true
        lastDrawnCell.current = `${cell.x},${cell.y}`
        onDrawPixel(cell.x, cell.y)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault()
      if (!isDrawing.current) return

      const cell = getCellFromPoint(e.clientX, e.clientY)
      if (cell) {
        const cellKey = `${cell.x},${cell.y}`
        if (cellKey !== lastDrawnCell.current) {
          lastDrawnCell.current = cellKey
          onDrawPixel(cell.x, cell.y)
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault()
      isDrawing.current = false
      lastDrawnCell.current = null
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    const onContextMenu = (e: Event) => {
      e.preventDefault()
    }

    const opts = { passive: false } as const

    canvas.addEventListener("pointerdown", onPointerDown, opts)
    canvas.addEventListener("pointermove", onPointerMove, opts)
    canvas.addEventListener("pointerup", onPointerUp, opts)
    canvas.addEventListener("pointerleave", onPointerUp)
    canvas.addEventListener("touchstart", onTouchStart, opts)
    canvas.addEventListener("touchmove", onTouchMove, opts)
    canvas.addEventListener("contextmenu", onContextMenu)

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointerleave", onPointerUp)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("contextmenu", onContextMenu)
    }
  }, [getCellFromPoint, onDrawPixel])

  return (
    <div ref={containerRef} className="flex-1 w-full overflow-hidden relative">
      <canvas
        ref={canvasRef}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          touchAction: "none",
        }}
        className="touch-none"
      />
    </div>
  )
}
