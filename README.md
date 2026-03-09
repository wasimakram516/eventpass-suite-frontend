## EventPass Suite – Frontend

EventPass Suite is a unified event engagement platform by **WhiteWall Digital Solutions**, providing tools for live quizzes, polls, Q&A, photo walls, registration, and check‑in experiences. This project contains the **Next.js frontend** that powers the CMS and attendee-facing views.

## Features

- **Modern CMS UI** for managing events, content, and engagement tools
- **Real-time experiences** powered by WebSockets (e.g., live quizzes, polls, audience interactions)
- **Event registration and check‑in** flows integrated with the backend APIs
- **Media & asset handling** using S3 / CloudFront
- **Analytics & reporting** for event performance (charts, exports, etc.)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: React 19 with modern hooks and components
- **UI Library**: MUI (Material UI) and Emotion
- **Real-time**: `socket.io-client`

## Project Structure (High-level)

- `src/app` – Next.js app routes (CMS, public interfaces, pages)
- `src/styles` – Global styles

## Environment Variables

Environment values are **not committed** directly. Use `.env.example` as a reference.

1. Copy the example file:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in the variables in `.env.local`:


> **Do not** commit your real `.env.local` or secrets to version control.

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Whitewall-Digital-Solutions/eventpass-suite-frontend.git
   cd EventPass/eventpass-suite-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment**

   - Create `.env.local` from `.env.example` as described above.
   - Make sure the backend is running and its URL matches `NEXT_PUBLIC_API_URL`.

## Running the Project

### Development

```bash
npm run dev
```

The app will be available at your configured host and `PORT`, for example:
- `http://<YOUR_FRONTEND_HOST>:<PORT>`


### Production Build

```bash
npm run build
npm start
```

This builds the optimized Next.js app and starts it in production mode. It will serve from your configured host and `PORT`, for example:
- `http://<YOUR_FRONTEND_HOST>:<PORT>`


## Related Services

This frontend is designed to work with the **EventPass Suite Backend** (Node.js / Express, MongoDB, Socket.IO). Ensure the backend is:

- Running on the port configured in its `.env` (default `4000`)
- Exposing the API under `/api` that matches `NEXT_PUBLIC_API_URL`

## License

© WhiteWall Digital Solutions. All rights reserved.
