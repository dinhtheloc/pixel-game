import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Minus,
  Plus,
} from "lucide-react"

const PAN_STEP = 30

interface ViewControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onPanBy: (dx: number, dy: number) => void
}

function CtrlBtn({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`retro-btn flex items-center justify-center w-9 h-9 p-0 ${className}`}
    >
      {children}
    </button>
  )
}

export default function ViewControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onPanBy,
}: ViewControlsProps) {
  const isZoomed = Math.abs(zoom - 1) > 0.05

  return (
    <>
      {/* Zoom buttons - top right */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
        <CtrlBtn onClick={onZoomIn}>
          <Plus size={16} strokeWidth={3} />
        </CtrlBtn>
        <CtrlBtn onClick={onZoomOut}>
          <Minus size={16} strokeWidth={3} />
        </CtrlBtn>
        {isZoomed && (
          <CtrlBtn onClick={onResetView}>
            <Crosshair size={16} strokeWidth={2.5} />
          </CtrlBtn>
        )}
      </div>

      {/* D-pad - bottom left, only visible when zoomed */}
      {isZoomed && (
        <div className="absolute bottom-2 left-2 z-10">
          <div className="grid grid-cols-3 gap-0.5 w-[7.5rem]">
            <div />
            <CtrlBtn onClick={() => onPanBy(0, PAN_STEP)}>
              <ChevronUp size={16} strokeWidth={3} />
            </CtrlBtn>
            <div />
            <CtrlBtn onClick={() => onPanBy(PAN_STEP, 0)}>
              <ChevronLeft size={16} strokeWidth={3} />
            </CtrlBtn>
            <CtrlBtn onClick={onResetView}>
              <Crosshair size={14} strokeWidth={2.5} />
            </CtrlBtn>
            <CtrlBtn onClick={() => onPanBy(-PAN_STEP, 0)}>
              <ChevronRight size={16} strokeWidth={3} />
            </CtrlBtn>
            <div />
            <CtrlBtn onClick={() => onPanBy(0, -PAN_STEP)}>
              <ChevronDown size={16} strokeWidth={3} />
            </CtrlBtn>
            <div />
          </div>
        </div>
      )}

      {/* Zoom level indicator */}
      {isZoomed && (
        <div
          className="absolute top-2 left-2 z-10 retro-btn cursor-default text-[9px] px-2 py-1"
        >
          {Math.round(zoom * 100)}%
        </div>
      )}
    </>
  )
}
