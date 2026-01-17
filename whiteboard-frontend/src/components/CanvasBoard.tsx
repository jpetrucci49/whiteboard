import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import Konva from "konva";
import io from "socket.io-client";

import { Toolbar } from "./Toolbar";

const socket = io("http://localhost:3001");

interface Point {
  x: number;
  y: number;
}

interface LineData {
  points: Point[];
  color: string;
  brushSize: number;
  userId: string;
}

interface CursorData {
  x: number;
  y: number;
}

interface User {
  id: string;
  color: string;
  cursor: CursorData | null;
}

export const CanvasBoard = () => {
  const [lines, setLines] = useState<LineData[]>([]); // Array of lines, each line is array of points with a color
  const [cursors, setCursors] = useState<User[]>([]);
  const [color, setColor] = useState("#df4b26"); // default orange
  const [brushSize, setBrushSize] = useState(5);

  const isDrawing = useRef(false);

  // Throttle cursor updates to reduce network spam
  const lastCursorSend = useRef(0);

  useEffect(() => {
    socket.emit("colorChange", color);
  }, [color]);

  useEffect(() => {
    // Join and get initial users
    socket.on("users", (users: User[]) => {
      setCursors(users);
    });

    socket.on("userJoined", (user: { id: string; color: string }) => {
      setCursors((prev) => [...prev, { ...user, cursor: null }]);
    });

    socket.on("userLeft", (id: string) => {
      setCursors((prev) => prev.filter((u) => u.id !== id));
    });

    socket.on("draw", (newLine: LineData) => {
      // Ignore own events
      if (newLine.userId !== socket.id) {
        setLines((prev) => [...prev, newLine]);
      }
    });

    socket.on(
      "cursor",
      ({ id, position }: { id: string; position: CursorData }) => {
        setCursors((prev) =>
          prev.map((u) => (u.id === id ? { ...u, cursor: position } : u))
        );
      }
    );

    return () => {
      socket.off("users");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("draw");
      socket.off("cursor");
    };
  }, []);

  // Send cursor position throttled (every 50ms)
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCursorSend.current < 50) return;
      lastCursorSend.current = now;

      const x = e.clientX;
      const y = e.clientY;
      socket.emit("cursor", { x, y });
    };

    window.addEventListener("mousemove", handleMouseMoveGlobal);
    return () => window.removeEventListener("mousemove", handleMouseMoveGlobal);
  }, []);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Start new line with current color & size
    const newLine: LineData = {
      points: [point],
      color,
      brushSize,
      userId: socket.id as string,
    };
    setLines([...lines, newLine]);

    // Send the start of the line to others
    socket.emit("draw", newLine);
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

      // Send the updated line in real-time (every move)
      socket.emit("draw", newLine);
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
          {cursors.map(
            (user) =>
              user.cursor && (
                <Circle
                  key={user.id}
                  x={user.cursor.x}
                  y={user.cursor.y}
                  radius={10}
                  fill={user.color}
                  opacity={0.7}
                />
              )
          )}
        </Layer>
      </Stage>
    </div>
  );
};
