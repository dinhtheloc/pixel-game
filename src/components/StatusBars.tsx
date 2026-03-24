interface StatusBarsProps {
  pixelCount: number
  maxPixels: number
  tool: "draw" | "erase"
  zoom: number
}

interface StatBarProps {
  label: string
  value: number
  max: number
}

function StatBar({ label, value, max }: StatBarProps) {
  const filled = Math.round((value / max) * 8)
  return (
    <div className="retro-outset flex flex-col items-center px-2 py-1 min-w-0 flex-1">
      <span className="text-[9px] font-bold tracking-wider truncate">
        {label}
      </span>
      <div className="flex gap-[2px] mt-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-[4px] h-[8px] rounded-[1px]"
            style={{
              backgroundColor:
                i < filled ? "var(--retro-fg)" : "var(--retro-border-dark)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function StatusBars({
  pixelCount,
  maxPixels,
  tool,
  zoom,
}: StatusBarsProps) {
  const pixelPercent = pixelCount
  const remaining = maxPixels - pixelCount
  const zoomLevel = Math.round(zoom * 100)

  return (
    <div className="flex gap-1.5 px-3 py-2">
      <StatBar label="PIXELS" value={pixelPercent} max={maxPixels} />
      <StatBar label="LEFT" value={remaining} max={maxPixels} />
      <StatBar
        label="TOOL"
        value={tool === "draw" ? 8 : 4}
        max={8}
      />
      <StatBar label="ZOOM" value={Math.min(zoomLevel, 500)} max={500} />
    </div>
  )
}
