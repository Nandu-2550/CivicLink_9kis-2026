import { useEffect, useRef, useState } from "react";

export function CameraModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  async function stop() {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function start() {
    setErr("");
    setStatus("starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErr("Camera not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch (e) {
      const msg = String(e?.message || e || "");
      const denied = e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError" || msg.toLowerCase().includes("permission");
      setStatus(denied ? "denied" : "error");
      setErr(denied ? "Camera permission denied." : "Failed to start camera.");
      await stop();
    }
  }

  async function snap() {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    await stop();
    onClose();
  }

  useEffect(() => {
    if (open) start();
    return () => { stop(); };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-2xl rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">Take picture</div>
          <button className="btn" type="button" onClick={async () => { await stop(); onClose(); }}>Close</button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <video ref={videoRef} className="w-full h-[360px] object-cover" playsInline muted />
        </div>
        {err && <div className="mt-3 text-sm text-amber-200">{err}</div>}
        <div className="mt-4 flex flex-wrap gap-3 justify-end">
          <button className="btn" type="button" onClick={start} disabled={status === "starting"}>Retry</button>
          <button className="btn btn-primary" type="button" onClick={snap} disabled={status !== "ready"}>Capture</button>
        </div>
      </div>
    </div>
  );
}
