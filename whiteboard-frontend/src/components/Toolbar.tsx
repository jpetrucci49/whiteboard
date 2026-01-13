interface ToolbarProps {
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
}

export const Toolbar = ({ color, setColor, size, setSize }: ToolbarProps) => {
  const colors = [
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
  ];

  return (
    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-4 z-10">
      {/* Color picker */}
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-full border-2 ${
              color === c
                ? "border-black dark:border-white"
                : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Brush size slider */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="size"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Size: {size}
        </label>
        <input
          id="size"
          type="range"
          min="1"
          max="30"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-32 accent-blue-500"
        />
      </div>
    </div>
  );
};
