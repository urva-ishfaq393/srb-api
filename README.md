# srb-api — Study Room Booking Service

CSC337 Advanced Web Technologies — Assignment 1
COMSATS University Islamabad, Department of Computer Science

Backend for a small study room booking system: Express + MongoDB (Mongoose) REST API, a GraphQL endpoint (Apollo Server) and real-time boards (Socket.IO). Every room has 2-hour slots (8, 10, 12, 14, 16) and a student books one seat in a slot.

## Quick start

```bash
npm install
cp .env.example .env      # then edit MONGODB_URL and ADMIN_KEY
npm run seed              # 4 rooms, 12 slots, 3 students (clears old data!)
npm start                 # or: npm run dev
```

| What | URL |
|---|---|
| Health | `GET http://localhost:3000/health` |
| REST API | `http://localhost:3000/api/v1` |
| GraphQL | `POST http://localhost:3000/graphql` (open it in a browser for the Apollo sandbox) |
| Board | `http://localhost:3000/board.html?room=ROOM-01` |
| Admin page | `http://localhost:3000/admin.html` |

`.env` (never committed — see `.env.example`):

```
PORT=3000
MONGODB_URL=mongodb://127.0.0.1:27017/srb
ADMIN_KEY=some-long-random-string
```

## Folder structure (Q1)

```
srb-api/
├── src/
│   ├── app.js            # builds the Express app (middleware, routes, /graphql, 404, error handler)
│   ├── server.js         # connects MongoDB, starts HTTP + Socket.IO
│   ├── config/           # reads .env
│   ├── routes/           # URL -> controller
│   ├── controllers/      # HTTP only: read request, send status + JSON
│   ├── services/         # all business rules (shared by REST, GraphQL, sockets)
│   ├── models/           # Mongoose schemas
│   ├── middleware/       # request logger, 404, error handler, async wrapper
│   ├── graphql/          # typeDefs + resolvers (call the same services)
│   └── sockets/          # Socket.IO setup
├── public/               # board.html, admin.html
├── scripts/seed.js       # sample data
├── postman/              # Postman collection
├── docs/                 # draw.io diagrams (Q2)
└── dashboard.graphql
```

Every error, from any route, has the same shape:

```json
{ "error": { "status": 404, "message": "Route not found" } }
```

Optional fields: `code` (e.g. `SLOT_FULL`) and `details` (field errors for 422).

## Diagrams (Q2)

`docs/srb-diagrams.drawio` — open it at [app.diagrams.net](https://app.diagrams.net) (File > Open from device). It has three pages: deployment diagram, ER diagram, sequence diagram (booking, including the full-slot case).

## REST API (Q3)

Rooms use `roomCode` in the URL. Lists are returned as `{ "data": [...] }`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/rooms` | all rooms |
| GET | `/api/v1/rooms/:roomCode` | 404 if missing |
| POST | `/api/v1/rooms` | `roomCode, name, building, seats` -> 201 |
| PUT | `/api/v1/rooms/:roomCode` | replace `name, building, seats` |
| PATCH | `/api/v1/rooms/:roomCode` | change some fields |
| DELETE | `/api/v1/rooms/:roomCode` | 204; 409 `ROOM_HAS_SLOTS` if slots exist |
| POST | `/api/v1/slots` | `roomCode, date, startHour`; `seats` copied from the room |
| GET | `/api/v1/slots/:id` | |
| GET | `/api/v1/slots?roomCode=&date=&hasSeats=true&page=&limit=` | paged: `{ data, page, limit, total, totalPages }` |
| POST | `/api/v1/students` | `regNo, name, email` |
| GET | `/api/v1/students/:regNo` | |
| POST | `/api/v1/students/:regNo/bookings` | `{ "slotId": "..." }` -> 201 |
| GET | `/api/v1/students/:regNo/bookings` | with room name, date, start hour |
| DELETE | `/api/v1/students/:regNo/bookings/:slotId` | 204 |

Status codes used: 200, 201, 204, **400** (bad id, bad query, malformed JSON, missing `slotId`), **404** (not found), **409** (conflict), **422** (invalid data, or trying to change `roomCode`).

Booking rules:

- 404 if the student or slot does not exist.
- 409 `ALREADY_BOOKED` if the student already has that slot (also enforced by a unique index on `regNo + slot`).
- 409 `SLOT_FULL` if no seat is free.
- The seat is taken with **one** `findOneAndUpdate({ _id, $expr: { $lt: ['$booked','$seats'] } }, { $inc: { booked: 1 } })`. If two students race for the last seat, MongoDB applies the update to only one document, so the other gets `SLOT_FULL`. If saving the booking row fails afterwards, the seat is given back.
- Cancelling deletes the booking and decreases `booked` by one.

Note: changing a room's `seats` does not change slots that already exist (a slot keeps the seat count copied when it was created).

Postman: import `postman/srb-api.postman_collection.json` (28 requests, with tests, success and failure cases). Run `npm run seed` first; the collection can be run repeatedly.

## GraphQL (Q4)

`POST /graphql` with Apollo Server.

- Queries: `rooms`, `slots(roomCode, date)`, `student(regNo)` (a student has `bookings` with `roomName`, `date`, `startHour`).
- Mutations: `bookSlot(regNo, slotId)`, `cancelBooking(regNo, slotId)`.
- The resolvers call the same functions in `src/services/` as the REST controllers, so no business code is repeated.
- `dashboard.graphql` is the single query that returns a student and all their bookings.

**Advantage over REST.** With REST the dashboard needs at least two calls (`GET /students/:regNo` and then `GET /students/:regNo/bookings`), and each response returns every field, wanted or not. With GraphQL one request asks for exactly the student fields and the booking fields the page needs, so there are fewer round trips, no over-fetching, and the client can add or remove a field without a new endpoint.

## Real time with Socket.IO (Q5)

Booking still goes through REST (or GraphQL). Services emit an internal `slot:updated` event after a booking or cancel, and the socket layer forwards it.

- `board.html?room=ROOM-01` emits `join:room` with the room code and receives `{ ok, room, slots }` in the acknowledgement. The server puts the socket in the Socket.IO room `room:ROOM-01`.
- On a booking or cancel the server emits `slot:updated` `{ slotId, seatsLeft }` **only** to that room.
- `/admin` namespace: connect with `io('/admin', { auth: { adminKey } })`. A wrong key is refused with the error `Invalid or missing admin key`. An admin emits `announce` with a message, and every connected board shows it. Use `admin.html` to try it.
- The board shows Connected / Disconnected. After a reconnect it joins the room again and receives fresh seats, so a server restart needs no page refresh.
- All text from the server or users is written with `textContent`, never `innerHTML`.

**How to test:** open two tabs of `board.html?room=ROOM-01` and one of `board.html?room=ROOM-02`. In Postman make a booking on a ROOM-01 slot (`POST /api/v1/students/FA23-BCS-045/bookings` with its slot id). Both ROOM-01 boards change at once; the ROOM-02 board does not. Stop and restart the server: boards show Disconnected, then Connected with correct seats.

## Push to GitHub

```bash
git init
git add .
git commit -m "Assignment 1: srb-api"
git branch -M main
git remote add origin https://github.com/<your-username>/srb-api.git
git push -u origin main
```
