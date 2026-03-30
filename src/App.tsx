import { useState } from "react"
import ColorPicker from "@/components/ColorPicker"
import PixelCanvas from "@/components/PixelCanvas"
import PresetPicker from "@/components/PresetPicker"
import StatusBars from "@/components/StatusBars"
import Toolbar from "@/components/Toolbar"
import ViewControls from "@/components/ViewControls"
import { usePixelCanvas } from "@/hooks/usePixelCanvas"

export default function App() {
  const canvas = usePixelCanvas()
  const [presetOpen, setPresetOpen] = useState(false)

  const handleLoadPreset = async (url: string) => {
    await canvas.loadAsStamp(url)
  }

  return (
    <div
      className="h-full flex flex-col gap-2 p-2!"
      style={{ backgroundColor: "var(--retro-bg)" }}
    >
      {/* Status bars - top */}
      <StatusBars
        pixelCount={canvas.pixelCount}
        maxPixels={canvas.maxPixels}
        tool={canvas.tool}
        zoom={canvas.zoom}
      />

      {/* Main screen area */}
      <div className="retro-inset mx-3 flex-1 flex flex-col overflow-hidden relative">
        <PixelCanvas
          pixels={canvas.pixels}
          gridSize={canvas.gridSize}
          zoom={canvas.zoom}
          pan={canvas.pan}
          onDrawPixel={canvas.drawPixel}
          onPanBy={canvas.panBy}
          pendingStamp={canvas.pendingStamp}
          stampPosition={canvas.stampPosition}
          onMoveStamp={canvas.moveStamp}
        />
        <ViewControls
          zoom={canvas.zoom}
          onZoomIn={canvas.zoomIn}
          onZoomOut={canvas.zoomOut}
          onResetView={canvas.resetView}
        />

        {/* Stamp placement overlay */}
        {canvas.pendingStamp && (
          <div className="absolute bottom-2 left-2 right-2 z-20 flex gap-2 items-center">
            <div
              className="retro-btn flex-1 text-center text-[10px] tracking-wider cursor-default py-2"
              style={{ color: "var(--retro-fg)" }}
            >
              <div>{canvas.pendingStamp!.pixels.size} px total</div>
              <div>+{canvas.stampPixelCost} new</div>
            </div>
            <button
              onClick={canvas.commitStamp}
              disabled={
                canvas.pixelCount + canvas.stampPixelCost > canvas.maxPixels
              }
              className="retro-btn flex-1 py-2 text-[10px] tracking-wider"
            >
              PLACE
            </button>
            <button
              onClick={canvas.cancelStamp}
              className="retro-btn flex-1 py-2 text-[10px] tracking-wider"
            >
              CANCEL
            </button>
          </div>
        )}
      </div>

      {/* Name label */}
      <div className="flex justify-center py-2">
        <span
          className="text-xl font-bold tracking-widest"
          style={{
            color: "var(--retro-fg)",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          Mango Pixel
        </span>
      </div>

      {/* Color picker */}
      <div className="retro-inset mx-3">
        <ColorPicker
          selectedColor={canvas.selectedColor}
          onSelectColor={canvas.setSelectedColor}
        />
      </div>

      {/* Bottom toolbar - icon bar */}
      <div className="pb-[env(safe-area-inset-bottom)]">
        <Toolbar
          tool={canvas.tool}
          setTool={canvas.setTool}
          canUndo={canvas.canUndo}
          canRedo={canvas.canRedo}
          onUndo={canvas.undo}
          onRedo={canvas.redo}
          onExport={canvas.exportAsJSON}
          onClear={canvas.clearCanvas}
          onLoadPreset={() => setPresetOpen(true)}
          pixelCount={canvas.pixelCount}
          maxPixels={canvas.maxPixels}
        />
      </div>

      {/* Preset picker modal */}
      <PresetPicker
        open={presetOpen}
        onClose={() => setPresetOpen(false)}
        onSelect={handleLoadPreset}
      />
    </div>
  )
}
