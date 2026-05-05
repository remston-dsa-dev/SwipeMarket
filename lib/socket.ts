import { io, type Socket } from "socket.io-client";
import { getExtra } from "@/lib/env";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const { socketUrl } = getExtra();
  if (socketUrl.length === 0) {
    return null;
  }
  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinRoom(roomId: string): void {
  const client = getSocket();
  client?.emit("join_room", { roomId });
}

export function sendSocketMessage(payload: {
  roomId: string;
  body: string;
}): void {
  const client = getSocket();
  client?.emit("send_message", payload);
}
