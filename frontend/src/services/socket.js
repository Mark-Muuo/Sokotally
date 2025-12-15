import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
    socket = io(url, { 
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }
  return socket;
}

export function joinUserRoom(userId) {
  const s = getSocket();
  s.emit('join-user-room', userId);
}

export function onTransactionCreated(callback) {
  const s = getSocket();
  s.on('transaction:created', callback);
  return () => s.off('transaction:created', callback);
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}


