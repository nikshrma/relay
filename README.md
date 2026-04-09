# Relay 💬

A real-time chat application built from scratch i.e. no Firebase, no Socket.IO, no magic. Just raw WebSockets, Express, React, and a PostgreSQL database.

## Why I Built This

I wanted to actually understand what happens under the hood when you send a message on WhatsApp or Telegram. How WebSockets and cookies actually work together. Not the "use this library and it works" kind of understanding. Relay is the result of that curiosity.

The goal was simple: build a full-stack chat app where two people can talk to each other in real time, with messages that persist, working authentication, and a decent frontend.

## What It Does

- **Real-time messaging** — Messages are sent and received instantly over WebSockets. No polling, no long-polling, no hacks.
- **Persistent history** — Every message is stored in PostgreSQL via Prisma. Close the tab, come back tomorrow, your messages are still there.
- **Cookie-based auth** — JWT tokens stored in httpOnly cookies. The WebSocket handshake authenticates by parsing cookies from the upgrade request headers.
- **Dual-protocol architecture** — REST API handles the CRUD stuff (auth, fetching users, loading message history). WebSockets handle the real-time stuff (sending messages, live delivery). Each protocol does what it's good at and that is exactly what I wanted to learn to do myself.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Real-time** | Native `ws` library (no Socket.IO) |
| **Auth** | JWT + httpOnly cookies, bcrypt |

### Why These Choices?

**Raw `ws` over Socket.IO** — Socket.IO abstracts away everything interesting. With raw WebSockets, I had to think about message framing, connection lifecycle, and protocol design myself. It also means the client uses the browser's native `WebSocket` API.

**Express 5** — It's something that I am quite comfortable with. Although I do plan to also learn other frameworks and backend languages like FastAPI, Go, Rust, altogether.

**Cookies over Bearer tokens** — For a chat app, the WebSocket connection needs to authenticate on the initial handshake. Cookies are sent automatically with the upgrade request. With bearer tokens, you'd have to shove the token into a query parameter or a subprotocol header, both of which are clunky.

## Architecture

```
                              ┌─────────────────────────────────────────────────────┐
                              │                     Frontend                        │
                              │  React + TypeScript + Vite                          │
                              │                                                     │
                              │  ┌──────────┐  ┌────────────┐  ┌──────────────────┐ │
                              │  │AuthContex│  │ useMessages│  │   useWebSocket   │ │
                              │  │  (auth)  │  │  (history) │  │  (live messages) │ │
                              │  └────┬─────┘  └─────┬──────┘  └────────┬─────────┘ │
                              │       │              │                  │           │
                              │       ▼              ▼                  ▼           │
                              │  ┌─────────────────────────┐    ┌───────────────┐   │
                              │  │    API Client (axios)   │    │  WebSocket API│   │
                              │  │   REST over HTTP        │    │  ws://        │   │
                              │  └────────────┬────────────┘    └───────┬───────┘   │
                              └───────────────┼─────────────────────────┼───────────┘
                                              │                         │
                                        HTTP  │                    WS   │
                                              ▼                         ▼
                              ┌─────────────────────────────────────────────────────┐
                              │                     Backend                         │
                              │  Node.js + Express + ws                             │
                              │                                                     │
                              │  ┌──────────────────┐      ┌──────────────────────┐ │
                              │  │   REST Routes    │      │   WebSocket Server   │ │
                              │  │ /signup, /signin │      │   message handling,  │ │
                              │  │ /users, /messages│      │  connection mgmt     │ │
                              │  │ /me, /logout     │      │                      │ │
                              │  └────────┬─────────┘      └──────────┬───────────┘ │
                              │           │                           │             │
                              │           ▼                           ▼             │
                              │  ┌─────────────────────────────────────────────────┐│
                              │  │                  Prisma ORM                     ││
                              │  │             PostgreSQL Database                 ││
                              │  └─────────────────────────────────────────────────┘│
                              └─────────────────────────────────────────────────────┘
```

### How a Message Actually Gets Sent

This is the part I find most interesting. Here's what happens when you hit send:

1. **Frontend** calls `sendMessage(to, content)` which writes a JSON frame to the open WebSocket: `{ type: "send_message", payload: { to, content } }`
2. **Backend WS handler** receives it, validates the payload, and does two things simultaneously:
   - Persists the message to PostgreSQL via Prisma
   - Looks up the recipient's socket in the in-memory connection store (which I will update to be a singleton SocketManager class instead of just a map)
3. If the recipient is online, the backend **pushes** the message to their socket as a `receive_message` event, they see it instantly
4. If they're offline, the message is still in the database. Next time they open the chat, the frontend fetches history via the REST endpoint `/messages?userId=...`
5. The sender gets an `ack` back over the WebSocket confirming the message was processed

No message broker, no queue, no Redis (yet - that is the plan for v2). Just an in-memory `Map<userId, WebSocket>` and a database. It's simple, it works for a single server, and it's the kind of thing that makes you appreciate what a system like Kafka(v2.5 maybe?) is actually solving when you eventually need it.

### The Auth Flow

Authentication was one of those things that seems simple until you realize OAuth WebSockets don't exist.

- **Signup/Signin** → Backend hashes the password with bcrypt, creates a JWT, and sets it as an httpOnly cookie
- **REST requests** → Auth middleware extracts the JWT from the cookie, verifies it, and attaches `req.id` to the request
- **WebSocket upgrade** → The `ws` library gives you the raw `IncomingMessage` from the HTTP upgrade. I parse the cookie header manually, extract the token, and verify it. If it's invalid, the socket gets closed with a `401 Unauthorized` code before any messages are exchanged

The frontend never sees or touches the token directly. The `AuthContext` just calls `/me` on mount to check if the cookie is still valid.

## Project Structure

```
relay/
├── backend_v1/
│   ├── prisma/
│   │   └── schema.prisma          # User and Message models
│   └── src/
│       ├── index.ts               # HTTP server + WS server bootstrap
│       ├── http/
│       │   ├── app.ts             # Express routes (auth, users, messages)
│       │   ├── middlewares/       # JWT auth middleware
│       │   └── services/          # Database query logic
│       ├── ws/
│       │   ├── socket.ts          # WebSocket server initialization
│       │   ├── store.ts           # In-memory connection tracking
│       │   └── handlers/          # Message handling logic
│       ├── lib/                   # Prisma client, shared utils
│       └── types/                 # TypeScript type definitions
│
└── frontend/
    └── src/
        ├── App.tsx                # Routing, auth guards
        ├── pages/                 # SignIn, SignUp, Chat, Landing
        ├── components/
        │   ├── chat/              # ChatWindow, MessageBubble
        │   ├── sidebar/           # UserList, Sidebar
        │   └── ui/                # Shared UI components
        ├── hooks/
        │   ├── useWebSocket.ts    # WebSocket connection + send
        │   └── useMessages.ts     # Message history + state
        ├── contexts/
        │   └── AuthContext.tsx     # Auth state management
        ├── services/
        │   └── api.ts             # Axios API client (singleton)
        └── types/
            └── index.ts           # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted instance)
- pnpm

### Setup

**1. Clone it**

```bash
git clone https://github.com/yourusername/relay.git
cd relay
```

**2. Backend**

```bash
cd backend_v1
pnpm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/relay"
JWT_SECRET="pick-something-long-and-random"
```

Run the database migrations and start the server:

```bash
npx prisma migrate dev
pnpm dev
```

The backend runs on `http://localhost:3000`.

**3. Frontend**

```bash
cd frontend
pnpm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL="http://localhost:3000"
```

```bash
pnpm dev
```

The frontend runs on `http://localhost:5173`.

**4. Try it out**

Open two browser windows. Sign up with two different accounts. Start chatting. Watch the messages appear in real time without a page refresh. That's the whole point and seeing that happen for the first time made me so happy.

## Database Schema

Two models, one relationship. Keeping it intentionally simple for V1(V1.5 & V2 will add a lot of complexity to this as I add message-status(Read, delivered etc))

```prisma
model User {
  id       String @id @default(uuid())
  number   String @unique
  password String
  name     String

  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
}

model Message {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())

  senderId   String
  receiverId String

  sender   User @relation("SentMessages", fields: [senderId], references: [id])
  receiver User @relation("ReceivedMessages", fields: [receiverId], references: [id])

  @@index([senderId, receiverId])
}
```

The composite index on `[senderId, receiverId]` is there because the most common query is "get all messages between user A and user B" and without it, that query does a full table scan.

## Roadmap

### V1.5 -> Hardening the Core

The foundation works, but it's not production-grade yet. V1.5 is about making the 1:1 chat feel solid before adding complexity:

- [ ] **SocketManager class** — Replace the in-memory Map with a proper class that handles multi-device connections, presence tracking, and broadcast patterns
- [ ] **Online/offline presence** — Show who's online in real time, powered by WebSocket lifecycle events
- [ ] **Typing indicators** — "User is typing..." with debounced WebSocket events
- [ ] **Message delivery status** — Sent → Delivered → Read, with a proper state machine and bidirectional acknowledgments
- [ ] **Zod validation** — Runtime request validation on all endpoints and WebSocket payloads
- [ ] **Cursor-based pagination** — Load message history in chunks instead of all at once
- [ ] **WebSocket reconnection** — Auto-reconnect with exponential backoff when the connection drops
- [ ] **Docker Compose** — One-command setup for the full stack

### V2 -> Scaling Out

- [ ] **Group messaging** — Pub/sub model for group chats
- [ ] **Redis** — Replace in-memory connection store with Redis pub/sub for horizontal scaling across multiple server instances
- [ ] **Message queuing** — Reliable delivery even when services are temporarily down

## Things I Learned

A few things that surprised me or took longer than expected:

- **Stale closures are the enemy of WebSocket hooks.** My first version of `useWebSocket` had a classic React stale closure bug , the `onMessage` callback was capturing an old `activeChat` value, so messages from User A would show up in User B's chat window. Fixed it with a `useRef` to always point to the latest callback.

- **Cookie parsing on WebSocket upgrade is manual.** There's no middleware chain for WebSocket connections. You get a raw `IncomingMessage` and you're on your own. I ended up using the `cookie` npm package to parse the header string.

- **You don't need Socket.IO.** The browser's native WebSocket API is clean, well-documented, and does exactly what you need for most use cases. Socket.IO adds reconnection and rooms, sure, but you can build those yourself in ~50 lines.

- **The Singleton pattern actually makes sense for API clients.** Having one Axios instance with interceptors and base config, shared across the entire app, is genuinely cleaner than importing axios everywhere and makes the developer's life so much easier in the long term.

## Why pnpm?

This is actually my first project using pnpm, and I'm not going back. Coming from npm, the difference was noticeable immediately:

- **Speed** — Installs are significantly faster.
- **Disk efficiency** — Instead of duplicating `node_modules` across every project, pnpm uses hard links and symlinks.
- **Better monorepo support** — With workspaces and a single lockfile, managing the backend and frontend in one repo feels much cleaner. That's what I learnt from my previous project which I made in TurboRepo with npm.

Honestly, I started using it because I kept hearing people recommend it , but the caching alone made it worth switching. Cold installs that used to take 30+ seconds are basically instant now.

---

Built by [Nikhil Sharma](https://github.com/nikshrma). If you're building something similar, feel free to reach out.
