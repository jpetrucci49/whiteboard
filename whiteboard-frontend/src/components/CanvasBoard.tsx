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
  const [users, setUsers] = useState<User[]>([]);
  const [color, setColor] = useState("#df4b26"); // default orange
  const [brushSize, setBrushSize] = useState(5);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const stageRef = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);

  // Throttle cursor updates to reduce network spam
  const lastCursorSend = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    socket.emit("colorChange", color);
  }, [color]);

  useEffect(() => {
    // Join and get initial users
    socket.on("users", (users: User[]) => {
      setUsers(users);
    });

    // New user joined
    socket.on("userJoined", (user: { id: string; color: string }) => {
      setUsers((prev) => [...prev, { ...user, cursor: null }]);
    });

    // User left
    socket.on("userLeft", (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    });

    // Receive drawing from other users
    socket.on("draw", (newLine: LineData) => {
      // Ignore own events
      if (newLine.userId !== socket.id) {
        setLines((prev) => [...prev, newLine]);
      }
    });

    // Receive cursor movement from other users
    socket.on(
      "cursor",
      ({ id, position }: { id: string; position: CursorData }) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, cursor: position } : u))
        );
      }
    );

    // Receive color change from other users
    socket.on(
      "colorChange",
      ({ id, color: newColor }: { id: string; color: string }) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, color: newColor } : u))
        );
      }
    );

    return () => {
      socket.off("users");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("draw");
      socket.off("cursor");
      socket.off("colorChange");
    };
  }, []);

  // Send cursor position throttled (every 50ms)
  useEffect(() => {
    const sendCursor = (position: CursorData | null) => {
      const now = Date.now();
      if (now - lastCursorSend.current < 50) return;
      lastCursorSend.current = now;
      socket.emit("cursor", position);
    };

    const handleMouseMove = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const relativePos = stage.getRelativePointerPosition();
      if (!relativePos) return;

      sendCursor({ x: relativePos.x, y: relativePos.y });
    };

    const handleFocus = () => {
      // Send current position on focus (if mouse is over)
      const stage = stageRef.current;
      if (!stage) return;

      const relativePos = stage.getRelativePointerPosition();
      if (relativePos) {
        sendCursor({ x: relativePos.x, y: relativePos.y });
      }
    };

    const handleBlur = () => {
      sendCursor(null); // Hide cursor on blur
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
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
    if (lastLine && lastLine.userId === socket.id) {
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
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves canvas
      >
        <Layer>
          {/* All lines (from self and others) */}
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
          {/* Live cursors from other users */}
          {users
            .filter((u) => u.id !== socket.id && u.cursor) // Hide self and null
            .map(
              (u) =>
                u.cursor && (
                  <Circle
                    key={u.id}
                    x={u.cursor.x}
                    y={u.cursor.y}
                    radius={10}
                    fill={u.color}
                    opacity={0.7}
                    shadowColor="black"
                    shadowBlur={5}
                    shadowOpacity={0.3}
                  />
                )
            )}
        </Layer>
      </Stage>
    </div>
  );
};
