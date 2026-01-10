# Real-Time Collaborative Whiteboard

A modern, real-time collaborative drawing app built with React 19, TypeScript, Konva.js, Socket.io, and Tailwind CSS.

Multiple users can draw on the same infinite canvas simultaneously — perfect for brainstorming, teaching, or doodling with friends.

## Features (MVP)

- Real-time drawing sync across all connected users
- Freehand drawing with color picker & brush size
- Live cursors showing who’s drawing where
- Clear canvas button
- Responsive & infinite canvas (zoom/pan planned)

## User Stories

**MVP (Must-Have - Core Functionality)**

- As a user, I want to open the app and start drawing immediately (no login required) so I can jump right in.
- As a user, I want my drawing actions (freehand lines, colors) to appear instantly for all connected users so we can collaborate in real time.
- As a user, I want to see other users' cursors moving on the canvas so I know who's drawing where.
- As a user, I want to change my brush color and size so I can express ideas better.
- As a user, I want to clear the entire canvas so we can start fresh.
- As a user, I want the canvas to be responsive and infinite so it works on any device and size.

**Nice-to-Have (Phase 2 - Polish & Scale)**

- As a user, I want to join or create private rooms so we can have focused sessions.
- As a user, I want undo/redo functionality so I can correct mistakes.
- As a user, I want to add text or basic shapes so I can annotate more easily.
- As a user, I want to export the drawing as PNG so I can save or share it.
- As a user, I want optional authentication so I can have persistent rooms.

## Tech Stack

**Frontend**  
- React 19 + TypeScript  
- Konva.js + react-konva (canvas & drawing)  
- Tailwind CSS (styling)  
- Socket.io-client (real-time)

**Backend**  
- Node.js + Express  
- Socket.io (WebSockets)  
- In-memory state (MVP) — PostgreSQL/Supabase planned later

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Frontend
```bash
cd whiteboard-frontend
npm install
npm run dev
```

### Backend
```bash
cd whiteboard-backend
npm install
node server.js
```

Open http://localhost:5173 — draw in one tab, open another to see sync!

## Why This Project?
This app demonstrates:  
- Real-time communication (WebSockets + Socket.io)  
- Complex canvas interactions (Konva.js)  
- Multi-user state synchronization  
- Modern full-stack architecture (React 19 + Node)  
- Responsive UI with Tailwind

## License
MIT