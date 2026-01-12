import { useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import Konva from "konva";

interface Point {
  x: number;
  y: number;
}

export const CanvasBoard = () => {
  const [lines, setLines] = useState<Point[][]>([]); // Array of lines, each line is array of points
  const isDrawing = useRef(false);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    setLines([...lines, [point]]);
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
      const newLine = [...lastLine, point];
      setLines([...lines.slice(0, -1), newLine]);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900">
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
              points={line.flatMap((p) => [p.x, p.y])}
              stroke="#df4b26"
              strokeWidth={5}
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
