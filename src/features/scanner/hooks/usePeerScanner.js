import { useEffect, useState } from 'react';
import { Peer } from 'peerjs';

export function usePeerScanner() {
  const [peerId, setPeerId] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const peer = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('connection', (conn) => {
      setIsConnected(true);
      
      conn.on('data', (data) => {
        setLastScannedCode(data);
      });

      conn.on('close', () => {
        setIsConnected(false);
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  return { peerId, lastScannedCode, isConnected, setLastScannedCode };
}
