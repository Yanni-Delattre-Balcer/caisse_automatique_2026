import React from 'react';
import { Card } from '@heroui/react';
import { QRCodeCanvas } from 'qrcode.react';
import { usePeerScanner } from './hooks/usePeerScanner';
import { Smartphone, CheckCircle2, Loader2, Info } from 'lucide-react';

export function RemoteScannerView() {
  const { peerId, isConnected, lastScannedCode } = usePeerScanner();

  // Assuming the scanner URL will be something like: https://[domain]/mobile-scanner?peer=[peerId]
  const scannerUrl = `${window.location.protocol}//${window.location.host}/mobile-scanner?peer=${peerId}`;

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-4 flex items-center justify-center gap-3">
          <Smartphone className="w-8 h-8 text-blue-400" />
          Appairage Douchette Magique
        </h1>
        <p className="text-zinc-400 text-lg font-light">
          Scannez ce QR Code avec l'appareil photo de votre smartphone pour l'utiliser comme lecteur de code-barres.
        </p>
      </div>

      <Card className="glass border-white/10 p-4 min-w-[340px] max-w-md w-full mb-8 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <div className={`absolute inset-0 bg-green-500/10 pointer-events-none transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="flex justify-between items-center px-4 pt-4 pb-0 z-10">
          <div className="font-semibold text-zinc-300 flex items-center gap-2">
            Status
          </div>
          {isConnected ? (
            <span className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-4 h-4" /> Connecté
            </span>
          ) : (
            <span className="flex items-center gap-2 text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> En attente...
            </span>
          )}
        </div>
        <div className="h-px w-full bg-white/5 my-4" />
        <div className="flex flex-col items-center justify-center py-8 z-10">
          {peerId ? (
            <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 duration-300">
              <QRCodeCanvas value={scannerUrl} size={200} level="H" />
            </div>
          ) : (
            <div className="h-[232px] w-[232px] flex items-center justify-center border-2 border-dashed border-white/20 text-zinc-500 rounded-2xl">
              Génération réseau...
            </div>
          )}
          
          <div className="mt-8 text-center text-sm font-medium text-zinc-500">
            Identifiant de session : <span className="text-zinc-300 ml-2 tracking-widest font-mono">{peerId || '...'}</span>
          </div>
        </div>
      </Card>

      <div className={`flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full flex-shrink-0 transition-opacity duration-300 ${lastScannedCode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Info className="w-5 h-5 text-blue-400" />
        <span className="text-zinc-300 font-medium">
          Dernier code scanné : <span className="text-white font-bold ml-1 tracking-wider">{lastScannedCode || 'Aucun'}</span>
        </span>
      </div>
    </div>
  );
}
