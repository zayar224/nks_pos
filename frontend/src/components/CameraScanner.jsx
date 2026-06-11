import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCamera, FiX } from "react-icons/fi";

function CameraScanner({ onDetected, onClose }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const quaggaRef = useRef(null);
  const [status, setStatus] = useState("initializing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const cleanup = () => {
      if (intervalId) clearInterval(intervalId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (quaggaRef.current) {
        try { quaggaRef.current.stop(); } catch {}
        const container = videoRef.current?.parentElement;
        if (container) {
          container.querySelectorAll("canvas, video").forEach((el) => {
            if (el !== videoRef.current) el.remove();
          });
        }
        quaggaRef.current = null;
      }
    };

    const startBarcodeDetector = async (stream) => {
      const video = videoRef.current;
      if (!video) return false;
      video.srcObject = stream;
      try { await video.play(); } catch {
        // Retry play() once if interrupted by re-render
        await new Promise((r) => setTimeout(r, 100));
        try { await video.play(); } catch { return false; }
      }
      if (!window.BarcodeDetector || !mounted) return false;
      const formats = await BarcodeDetector.getSupportedFormats();
      const supported = formats.filter((f) =>
        ["code_128","ean_13","ean_8","upc_a","upc_e","code_39","codabar","itf"].includes(f)
      );
      if (supported.length === 0) return false;
      if (!mounted) return true;
      setStatus("scanning");
      const detector = new BarcodeDetector({ formats: supported });
      let detecting = false;
      intervalId = setInterval(async () => {
        if (detecting || !mounted) return;
        detecting = true;
        try {
          const barcodes = await detector.detect(video);
          for (const b of barcodes) {
            if (b.rawValue && mounted) {
              cleanup();
              onDetected(b.rawValue);
              return;
            }
          }
        } catch {} finally { detecting = false; }
      }, 300);
      return true;
    };

    const startQuagga = async () => {
      try {
        let Quagga;
        try {
          ({ default: Quagga } = await import("@ericblade/quagga2"));
        } catch {
          ({ default: Quagga } = await import(
            "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.9.4/+esm"
          ));
        }
        if (!mounted) return;
        quaggaRef.current = Quagga;
        const videoEl = videoRef.current;
        if (videoEl) videoEl.style.display = "none";
        setStatus("scanning");
        const target = videoRef.current?.parentElement;
        if (!target) { setStatus("unsupported"); return; }
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target,
            constraints: { facingMode: "environment", width: 640, height: 480 },
          },
          decoder: {
            readers: ["code_128_reader","ean_reader","ean_8_reader","upc_reader","code_39_reader","codabar_reader","i2of5_reader"],
          },
          locate: false,
        }, (err) => {
          if (!mounted) return;
          if (err) { console.error("Quagga init error:", err); setStatus("unsupported"); return; }
          Quagga.start();
          Quagga.onDetected((data) => {
            const code = data.codeResult.code;
            if (code && mounted) { cleanup(); onDetected(code); }
          });
        });
      } catch (quaggaErr) {
        console.error("Quagga load error:", quaggaErr);
        if (mounted) setStatus("unsupported");
      }
    };

    const start = async () => {
      if (window.BarcodeDetector) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
          });
          if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          const used = await startBarcodeDetector(stream);
          if (used) return;
          cleanup();
        } catch (err) {
          if (!mounted) return;
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setErrorMsg(t("camera_permission_denied")); setStatus("error"); return;
          }
          if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setErrorMsg(t("camera_not_found")); setStatus("error"); return;
          }
          console.warn("BarcodeDetector failed, trying quagga:", err);
        }
      }
      await startQuagga();
    };

    start();
    return cleanup;
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FiCamera />
            {t("scan_barcode")}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <FiX size={20} />
          </button>
        </div>

        <div className="overflow-hidden rounded-lg bg-black relative" style={{ minHeight: 240 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full block ${status === "scanning" || status === "initializing" ? "" : "hidden"}`}
            style={{ minHeight: 240, maxHeight: 320, objectFit: "cover" }}
          />
          {status === "scanning" && (
            <>
              <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-0.5 bg-indigo-500 opacity-70 animate-pulse" />
              <p className="absolute bottom-2 left-0 right-0 text-xs text-white/70 text-center">
                {t("point_camera_at_barcode")}
              </p>
            </>
          )}
          {status === "initializing" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white/70">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span className="text-sm">{t("loading")}</span>
              </div>
            </div>
          )}
        </div>

        {status === "error" && (
          <div className="text-center py-6 text-gray-500">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FiX className="text-red-500" size={20} />
            </div>
            <p>{errorMsg}</p>
            <button onClick={onClose} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg">
              {t("close")}
            </button>
          </div>
        )}

        {status === "unsupported" && (
          <div className="text-center py-6 text-gray-500">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <FiCamera className="text-yellow-600" size={20} />
            </div>
            <p>{t("barcode_scanner_unsupported")}</p>
            <p className="text-xs mt-1">{t("use_manual_barcode_input")}</p>
            <button onClick={onClose} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg">
              {t("close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraScanner;
