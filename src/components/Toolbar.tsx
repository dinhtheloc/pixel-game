import {
  Download,
  Eraser,
  FolderOpen,
  Pencil,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react"

interface ToolbarProps {
  tool: "draw" | "erase"
  setTool: (tool: "draw" | "erase") => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onClear: () => void
  onLoadPreset: () => void
  pixelCount: number
  maxPixels: number
}

export default function Toolbar({
  tool,
  setTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onClear,
  onLoadPreset,
  pixelCount,
  maxPixels,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-center px-2 py-2 gap-1.5 flex-wrap">
      <button
        onClick={onLoadPreset}
        className="retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5"
        aria-label="Load"
      >
        <FolderOpen size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Load</span>
      </button>

      <button
        onClick={() => setTool("draw")}
        className={`retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5 ${tool === "draw" ? "active" : ""}`}
        aria-label="Draw"
      >
        <Pencil size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Draw</span>
      </button>

      <button
        onClick={() => setTool("erase")}
        className={`retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5 ${tool === "erase" ? "active" : ""}`}
        aria-label="Erase"
      >
        <Eraser size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Erase</span>
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5"
        aria-label="Undo"
      >
        <Undo2 size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Undo</span>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5"
        aria-label="Redo"
      >
        <Redo2 size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Redo</span>
      </button>

      <button
        onClick={onClear}
        className="retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5"
        aria-label="Clear"
      >
        <Trash2 size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Clear</span>
      </button>

      <button
        onClick={onExport}
        className="retro-btn flex flex-col items-center gap-0.5 px-2.5 py-1.5"
        aria-label="Save"
      >
        <Download size={18} strokeWidth={2.5} />
        <span className="text-[8px]">Save</span>
      </button>

      <div className="retro-btn flex flex-col items-center gap-0.5 px-2 py-1.5 cursor-default">
        <span className="text-[10px] font-bold tabular-nums">{pixelCount}</span>
        <span className="text-[7px]">/{maxPixels}</span>
      </div>
    </div>
  )
}
