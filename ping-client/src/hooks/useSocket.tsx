//import { socket } from "@/socket";

import { useState, useEffect } from "react";
import socketIOClient, { type Socket } from "socket.io-client";

const URL = process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000";

type fnType = () => void;

export function useSocket<TData>(eventName: string, callback: fnType) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = socketIOClient(URL as string);
    setSocket(newSocket);

    // Evento de conexión exitosa
    newSocket.on("connect", () => console.log("Socket conectado"));

    // Lógica del evento específico
    newSocket.on(eventName, callback);

    // Limpieza: desconectar el socket al desmontar el componente
    return () => {
      newSocket.close();
    };
  }, [eventName, callback]);

  const send = (data: TData) => {
    if (socket) {
      socket.emit(eventName, data);
    }
  };

  return [socket, send];
}

export default useSocket;
