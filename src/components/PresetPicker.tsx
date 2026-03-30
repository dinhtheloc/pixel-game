interface Preset {
  name: string
  file: string
}

const PRESETS: Preset[] = [
  { name: "Test", file: "/test.piskel" },
  { name: "Demo", file: "/demo.piskel" },
]

interface PresetPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export default function PresetPicker({
  open,
  onClose,
  onSelect,
}: PresetPickerProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="retro-outset mx-6 w-full max-w-sm p-4"
        style={{ backgroundColor: "var(--retro-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-center text-sm font-bold tracking-widest mb-3"
          style={{ color: "var(--retro-fg)" }}
        >
          LOAD PRESET
        </h2>

        <div className="flex flex-col gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.file}
              onClick={() => {
                onSelect(preset.file)
                onClose()
              }}
              className="retro-btn py-3 text-xs tracking-wider"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="retro-btn w-full mt-3 py-2 text-xs tracking-wider"
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}
