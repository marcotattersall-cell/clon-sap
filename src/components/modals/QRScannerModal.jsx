import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, QrCode, Sparkles, CheckCircle2 } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, onScanSuccess, title = "Escáner QR / Código de Barras SAP" }) => {
  const [scanResult, setScanResult] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let html5Qrcode = null;
    const scannerId = "qr-reader-container";

    const startScanner = async () => {
      try {
        setCameraError('');
        setIsScanning(true);
        html5Qrcode = new Html5Qrcode(scannerId);

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 }
          },
          (decodedText) => {
            console.log("[QR Scanner] Código detectado:", decodedText);
            setScanResult(decodedText);
            if (html5Qrcode && html5Qrcode.isScanning) {
              html5Qrcode.stop().catch(err => console.warn(err));
            }
            setIsScanning(false);
            if (onScanSuccess) {
              onScanSuccess(decodedText);
            }
            onClose();
          },
          (errorMessage) => {
            // Ignorar errores frame-by-frame sin código detectado
          }
        );
      } catch (err) {
        console.warn("[QR Scanner] No se pudo acceder a la cámara:", err);
        setCameraError("No se pudo iniciar la cámara del dispositivo. Puedes usar la simulación manual para pruebas.");
        setIsScanning(false);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(err => console.warn(err));
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (code) => {
    setScanResult(code);
    if (onScanSuccess) {
      onScanSuccess(code);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-sap-blue/20 text-sap-blue border border-sap-blue/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{title}</h3>
              <p className="text-xs text-slate-400">Escaneo óptico desde la cámara en terreno</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Visor Container */}
        <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-2 overflow-hidden flex flex-col items-center justify-center min-h-[280px]">
          <div id="qr-reader-container" className="w-full rounded-xl overflow-hidden"></div>

          {cameraError && (
            <div className="p-4 text-center space-y-2">
              <Camera className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
              <p className="text-xs text-amber-300 font-medium">{cameraError}</p>
            </div>
          )}

          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-60 h-60 border-2 border-sap-blue rounded-2xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-sap-blue"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-sap-blue"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-sap-blue"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-sap-blue"></div>
                {/* Laser Bar Animation */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] absolute top-1/2 -translate-y-1/2 animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Demo QR Test Bar */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 text-center">
          <span className="text-[11px] font-bold text-slate-400 flex items-center justify-center space-x-1 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulación de Código QR para Pruebas</span>
          </span>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <button
              onClick={() => handleSimulateScan('MAT-1001')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-sap-blue rounded-lg font-mono text-slate-200 hover:text-white transition-all border border-slate-700"
            >
              MAT-1001 (Filtro)
            </button>
            <button
              onClick={() => handleSimulateScan('MAT-1002')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-sap-blue rounded-lg font-mono text-slate-200 hover:text-white transition-all border border-slate-700"
            >
              MAT-1002 (Aceite)
            </button>
            <button
              onClick={() => handleSimulateScan('EQ-101')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 rounded-lg font-mono text-slate-200 hover:text-white transition-all border border-slate-700"
            >
              EQ-101 (Camión)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
