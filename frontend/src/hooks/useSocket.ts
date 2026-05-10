'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('authenticate', token);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
