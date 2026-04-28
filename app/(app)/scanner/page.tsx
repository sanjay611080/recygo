"use client";

import { useEffect, useRef, useState } from "react";
import AppHeader from "../AppHeader";

const CATEGORIES = [
  { name: "Plastic", icon: "🥤", label: "PLASTIC" },
  { name: "Paper", icon: "📄", label: "PAPER" },
  { name: "Metal", icon: "🔩", label: "METAL" },
  { name: "Glass", icon: "🍷", label: "GLASS" },
  { name: "Cloth", icon: "👕", label: "CLOTH" },
  { name: "Cardboard", icon: "📦", label: "CARDBOARD" },
];

const ANGLES = ["FRONT", "SIDE", "TOP"];

interface CapturedPhoto {
  dataUrl: string;
  angle: string;
  capturedAt: string;
}

export default function ScannerPage() {
  const [step, setStep] = useState<"category" | "scan">("category");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [weight, setWeight] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [servoOpen, setServoOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | string>(3);
  const [servoStatus, setServoStatus] = useState("Wait, bin opening in...");
  const [arcOffset, setArcOffset] = useState(0);
  const arcCircumference = 364.4;

  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardDisplay, setRewardDisplay] = useState("0");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const toggleWebcam = async () => {
    if (cameraOn) {
      stopCamera();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      alert("Camera error!");
    }
  };

  const captureImage = () => {
    if (photos.length >= 3) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      alert("Start the camera first.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const angle = ANGLES[photos.length];
    setPhotos((prev) => [
      ...prev,
      {
        dataUrl: canvas.toDataURL("image/png"),
        angle,
        capturedAt: new Date().toISOString(),
      },
    ]);
  };

  const allCaptured = photos.length === 3;
  const nextAngle = ANGLES[photos.length];

  const proceed = async () => {
    const w = parseFloat(weight);
    if (!w) {
      alert("Enter weight!");
      return;
    }
    const tokens = Math.floor(w / 10);
    setSubmitting(true);
    setServoOpen(true);
    setServoStatus("Wait, bin opening in...");
    setArcOffset(0);

    let count = 3;
    setCountdown(count);
    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        count--;
        setCountdown(count === 0 ? "✓" : count);
        setArcOffset((3 - count) * (arcCircumference / 3));
        if (count === 0) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });

    setServoStatus("Bin Open! Logging...");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          weight: w,
          photos: photos.map((p) => ({
            dataUrl: p.dataUrl,
            angle: p.angle,
            capturedAt: p.capturedAt,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body.error ?? "Failed to log session");
      }
    } catch {
      alert("Connection error, but simulating success.");
    }

    setTimeout(() => {
      setServoOpen(false);
      setRewardDisplay(`+${tokens}`);
      setRewardOpen(true);
      setSubmitting(false);
    }, 700);
  };

  const acknowledge = () => {
    setRewardOpen(false);
    setPhotos([]);
    setWeight("");
    stopCamera();
    setStep("category");
    setCategory("");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("focus"));
    }
  };

  if (step === "category") {
    return (
      <>
        <AppHeader title="RECYGO TERMINAL" />
        <div className="category-screen-inline">
          <div className="category-container">
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "var(--accent)" }}>
              Select Waste Category
            </h2>
            <div className="category-grid">
              {CATEGORIES.map((c) => (
                <div
                  key={c.name}
                  className="cat-item"
                  onClick={() => {
                    setCategory(c.name);
                    setStep("scan");
                  }}
                >
                  <span className="icon">{c.icon}</span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="RECYGO TERMINAL" />
      <div className="scanner-layout">
        <div className="viewport">
          <div className="log-stream">
            <span>LOG_STREAM: {category.toUpperCase() || "..."}</span>
            <span className="angle-pill">
              {allCaptured
                ? "ALL CAPTURED · 3/3"
                : `NEXT: ${nextAngle} · ${photos.length + 1}/3`}
            </span>
          </div>
          <div className="video-wrap">
            <video ref={videoRef} className="webcam-feed" autoPlay playsInline />
            {!cameraOn && (
              <div className="video-placeholder">Camera is off</div>
            )}
          </div>

          {!allCaptured && (
            <div className="capture-controls">
              <button className="btn btn-outline" onClick={toggleWebcam}>
                {cameraOn ? "Stop Camera" : "Start Camera"}
              </button>
              <button
                className="btn btn-primary"
                style={{ width: 220 }}
                onClick={captureImage}
                disabled={!cameraOn}
              >
                Capture {nextAngle}
              </button>
            </div>
          )}

          {allCaptured && (
            <div className="next-step-area">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Mass (Grams)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={proceed}
                  disabled={submitting}
                >
                  Calculate & Discard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="preview-stack">
          {ANGLES.map((angle, i) => {
            const photo = photos[i];
            return (
              <div className="angle-card" key={angle}>
                {photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.dataUrl} alt={`${angle} capture`} />
                    <span className="tag">
                      0{i + 1}_{angle}_OK
                    </span>
                  </>
                ) : (
                  <span className="tag">
                    0{i + 1}_{angle}_EMPTY
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`servo-overlay${servoOpen ? " show" : ""}`}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
            {servoStatus}
          </div>
        </div>
        <div
          style={{
            margin: "20px 0",
            position: "relative",
            width: 120,
            height: 120,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r="58"
              fill="none"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="8"
            />
            <circle
              cx="70"
              cy="70"
              r="58"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeDasharray={arcCircumference}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="countdown-text">{countdown}</div>
        </div>
      </div>

      <div className={`overlay${rewardOpen ? " show" : ""}`}>
        <div className="auth-card" style={{ maxWidth: 340 }}>
          <h2 style={{ color: "var(--success)", marginBottom: 15 }}>
            Analysis Logged
          </h2>
          <div
            style={{
              background: "var(--soft-green)",
              padding: 20,
              borderRadius: 15,
              marginBottom: 20,
            }}
          >
            <div className="reward-display">{rewardDisplay}</div>
            <div
              style={{
                fontSize: 10,
                color: "var(--accent)",
                textTransform: "uppercase",
              }}
            >
              Tokens Earned
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={acknowledge}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </>
  );
}
