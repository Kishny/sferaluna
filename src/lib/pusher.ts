// src/lib/pusher.ts  — client serveur (Node.js uniquement)
//
// Requires the following env variables in .env.local :
//   PUSHER_APP_ID=
//   PUSHER_KEY=
//   PUSHER_SECRET=
//   PUSHER_CLUSTER=eu

import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "eu",
  useTLS: true,
});
