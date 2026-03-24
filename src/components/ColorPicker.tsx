const PALETTE = [
  "#2d3328",
  "#4a5240",
  "#6b7353",
  "#8b956d",
  "#a3b089",
  "#c8d4a9",
  "#ff6b6b",
  "#ee5a24",
  "#f0932b",
  "#f6e58d",
  "#badc58",
  "#6ab04c",
  "#22a6b3",
  "#7ed6df",
  "#4834d4",
  "#686de0",
  "#be2edd",
  "#e056fd",
  "#ffffff",
  "#000000",
]

interface ColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export default function ColorPicker({
  selectedColor,
  onSelectColor,
}: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* <input
        type="color"
        value={selectedColor}
        onChange={(e) => onSelectColor(e.target.value)}
        className="w-8 h-8 rounded border-2 cursor-pointer shrink-0"
        style={{
          borderColor: "var(--retro-border-dark)",
          backgroundColor: selectedColor,
        }}
      /> */}
      <div className="flex gap-1 p-2! justify-center flex-wrap">
        {PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => onSelectColor(color)}
            className="shrink-0 w-8 h-8 rounded active:scale-90 transition-transform"
            style={{
              backgroundColor: color,
              border:
                selectedColor === color
                  ? "3px solid var(--retro-fg)"
                  : "2px solid var(--retro-border-dark)",
              boxShadow:
                selectedColor === color
                  ? "0 0 0 1px var(--retro-border-light)"
                  : "none",
            }}
          />
        ))}
      </div>
    </div>
  )
}
