import { useCallback, useEffect, useRef, useState } from "react"
import type { PendingStamp, PixelMap } from "@/hooks/usePixelCanvas"

interface PixelCanvasProps {
  pixels: PixelMap
  gridSize: number
  zoom: number
  pan: { x: number; y: number }
  onDrawPixel: (x: number, y: number) => void
  onPanBy: (dx: number, dy: number) => void
  pendingStamp?: PendingStamp | null
  stampPosition?: { x: number; y: number }
  onMoveStamp?: (x: number, y: number) => void
}

export default function PixelCanvas({
  pixels,
  gridSize,
  zoom,
  pan,
  onDrawPixel,
  onPanBy,
  pendingStamp,
  stampPosition,
  onMoveStamp,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const lastDrawnCell = useRef<string | null>(null)
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const isPanning = useRef(false)
  const lastPanMidpoint = useRef<{ x: number; y: number } | null>(null)
  const pendingCell = useRef<{ x: number; y: number } | null>(null)
  const hasMoved = useRef(false)

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

    if (pendingStamp && stampPosition) {
      ctx.globalAlpha = 0.55
      pendingStamp.pixels.forEach((color, key) => {
        const [rx, ry] = key.split(",").map(Number)
        const ax = rx + stampPosition.x
        const ay = ry + stampPosition.y
        if (ax < 0 || ax >= gridSize || ay < 0 || ay >= gridSize) return
        ctx.fillStyle = color
        ctx.fillRect(
          offsetX + ax * cellSize + 0.5,
          offsetY + ay * cellSize + 0.5,
          cellSize - 1,
          cellSize - 1,
        )
      })
      ctx.globalAlpha = 1
    }

    ctx.strokeStyle = "#6b7353"
    ctx.lineWidth = 2
    ctx.strokeRect(offsetX, offsetY, cellSize * gridSize, cellSize * gridSize)
  }, [canvasSize, gridSize, zoom, pan, pixels, pendingStamp, stampPosition])

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

    const getMidpoint = () => {
      const pts = Array.from(activePointers.current.values())
      return {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointers.current.size >= 2) {
        isPanning.current = true
        isDrawing.current = false
        lastDrawnCell.current = null
        pendingCell.current = null
        hasMoved.current = false
        lastPanMidpoint.current = getMidpoint()
      } else {
        isPanning.current = false
        isDrawing.current = false
        hasMoved.current = false
        pendingCell.current = getCellFromPoint(e.clientX, e.clientY)

        // In stamp mode: move stamp on touch down immediately
        if (pendingStamp && onMoveStamp) {
          const cell = getCellFromPoint(e.clientX, e.clientY)
          if (cell) {
            onMoveStamp(
              cell.x - Math.floor(pendingStamp.width / 2),
              cell.y - Math.floor(pendingStamp.height / 2),
            )
          }
        }
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault()
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (isPanning.current && activePointers.current.size >= 2) {
        const mid = getMidpoint()
        if (lastPanMidpoint.current) {
          onPanBy(mid.x - lastPanMidpoint.current.x, mid.y - lastPanMidpoint.current.y)
        }
        lastPanMidpoint.current = mid
      } else if (!isPanning.current && activePointers.current.size === 1) {
        // In stamp mode: drag moves stamp position
        if (pendingStamp && onMoveStamp) {
          hasMoved.current = true
          const cell = getCellFromPoint(e.clientX, e.clientY)
          if (cell) {
            onMoveStamp(
              cell.x - Math.floor(pendingStamp.width / 2),
              cell.y - Math.floor(pendingStamp.height / 2),
            )
          }
          return
        }

        // Commit draw from initial touch if not started yet
        if (!isDrawing.current && pendingCell.current) {
          isDrawing.current = true
          lastDrawnCell.current = `${pendingCell.current.x},${pendingCell.current.y}`
          onDrawPixel(pendingCell.current.x, pendingCell.current.y)
          pendingCell.current = null
        }
        hasMoved.current = true
        const cell = getCellFromPoint(e.clientX, e.clientY)
        if (cell && isDrawing.current) {
          const cellKey = `${cell.x},${cell.y}`
          if (cellKey !== lastDrawnCell.current) {
            lastDrawnCell.current = cellKey
            onDrawPixel(cell.x, cell.y)
          }
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault()
      activePointers.current.delete(e.pointerId)

      // In stamp mode: no draw on tap, stamp is positioned on pointerdown/move
      if (pendingStamp) {
        pendingCell.current = null
        hasMoved.current = false
        if (activePointers.current.size === 0) {
          isDrawing.current = false
          lastDrawnCell.current = null
        }
        return
      }

      // Tap (no movement): draw the pending cell now
      if (!hasMoved.current && !isPanning.current && pendingCell.current) {
        onDrawPixel(pendingCell.current.x, pendingCell.current.y)
      }
      pendingCell.current = null
      hasMoved.current = false

      if (activePointers.current.size < 2) {
        isPanning.current = false
        lastPanMidpoint.current = null
      }
      if (activePointers.current.size === 0) {
        isDrawing.current = false
        lastDrawnCell.current = null
      }
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
  }, [getCellFromPoint, onDrawPixel, onPanBy, pendingStamp, onMoveStamp])

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
