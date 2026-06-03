// src/lib/pusher-client.ts  — client browser uniquement
//
// Requires the following env variables in .env.local :
//   NEXT_PUBLIC_PUSHER_KEY=
//   NEXT_PUBLIC_PUSHER_CLUSTER=eu

import type PusherType from "pusher-js";

let _pusherClient: PusherType | null = null;

export function getPusherClient(): PusherType {
  if (typeof window === "undefined") {
    throw new Error("getPusherClient() ne peut être appelé que côté client.");
  }

  if (!_pusherClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Pusher = require("pusher-js") as typeof PusherType;
    _pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu",
      authEndpoint: "/api/pusher/auth",
    });
  }

  return _pusherClient;
}
