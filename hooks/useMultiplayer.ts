
import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { MultiplayerMessage } from '../types';

const ID_PREFIX = 'npat-game-';

const generateRoomCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const useMultiplayer = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MultiplayerMessage[]>([]);
  const peerRef = useRef<Peer | null>(null);

  // Initialize Peer with a random 4-digit code
  const initializePeer = useCallback(() => {
    if (peerRef.current) return;

    const createPeer = () => {
      const code = generateRoomCode();
      const id = `${ID_PREFIX}${code}`;
      console.log('Attempting to create room with ID:', id);
      
      const newPeer = new Peer(id);

      newPeer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        setPeerId(id);
      });

      newPeer.on('connection', (conn) => {
        console.log('Incoming connection...');
        handleConnection(conn);
      });

      newPeer.on('error', (err: any) => {
        console.error('Peer error:', err);
        // If ID is taken, retry with a new code
        if (err.type === 'unavailable-id') {
          console.log('ID taken, retrying...');
          newPeer.destroy();
          createPeer();
        }
      });

      peerRef.current = newPeer;
    };

    createPeer();
  }, []);

  const handleConnection = (conn: DataConnection) => {
    conn.on('open', () => {
      console.log('Connected to: ' + conn.peer);
      setIsConnected(true);
      setConnection(conn);
    });

    conn.on('data', (data) => {
      setMessages((prev) => [...prev, data as MultiplayerMessage]);
    });

    conn.on('close', () => {
      console.log('Connection closed');
      setIsConnected(false);
      setConnection(null);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      setIsConnected(false);
    });
  };

  const connectToPeer = (roomCode: string) => {
    if (!peerRef.current) return;
    const targetPeerId = `${ID_PREFIX}${roomCode}`;
    // Using serialization: 'json' helps with cross-browser/device compatibility and lag
    const conn = peerRef.current.connect(targetPeerId, { serialization: 'json' });
    handleConnection(conn);
  };

  const sendMessage = (msg: MultiplayerMessage) => {
    if (connection && isConnected) {
      try {
        connection.send(msg);
      } catch (e) {
        console.error("Failed to send message", e);
      }
    } else {
      console.warn("Attempted to send message while disconnected");
    }
  };

  const clearMessages = () => setMessages([]);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  return {
    peerId,
    initializePeer,
    connectToPeer,
    sendMessage,
    messages,
    isConnected,
    clearMessages
  };
};
