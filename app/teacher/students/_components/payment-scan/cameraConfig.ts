import type { Html5QrcodeCameraScanConfig } from "html5-qrcode";

export function paymentCameraConfig(highResolution = true): Html5QrcodeCameraScanConfig {
  return {
    fps: 10,
    qrbox: (width, height) => { const size = Math.floor(Math.min(width, height) * 0.85); return { width: size, height: size }; },
    // The first start() argument accepts exactly one key. Extended media
    // constraints belong here, not beside cameraIdOrConfig.facingMode.
    ...(highResolution ? { videoConstraints: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } } : {}),
  };
}

export function isCameraConstraintError(error: unknown): boolean {
  const details = typeof error === "string" ? error : error && typeof error === "object" ? `${"name" in error ? error.name : ""} ${"message" in error ? error.message : ""}` : "";
  return /OverconstrainedError|ConstraintNotSatisfiedError/i.test(details);
}
