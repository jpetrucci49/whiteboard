import { useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import Konva from "konva";

import { Toolbar } from "./Toolbar";

interface Point {
  x: number;
  y: number;
}

interface LineData {
  points: Point[];
  color: string;
  brushSize: number;
}

export const CanvasBoard = () => {
  const [lines, setLines] = useState<LineData[]>([]); // Array of lines, each line is array of points with a color
  const [color, setColor] = useState("#df4b26"); // default orange
  const [brushSize, setBrushSize] = useState(5);

  const isDrawing = useRef(false);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    setLines([...lines, { points: [point], color, brushSize }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Get the last line and append the new point
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      const newLine = { ...lastLine, points: [...lastLine.points, point] };
      setLines([...lines.slice(0, -1), newLine]);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900">
      <Toolbar
        color={color}
        setColor={setColor}
        size={brushSize}
        setSize={setBrushSize}
      />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves canvas
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points.flatMap((p) => [p.x, p.y])}
              stroke={line.color}
              strokeWidth={line.brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
