"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useScanSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundReady, setSoundReady] = useState(false);
  const enabled = useRef(true),
    context = useRef<AudioContext | null>(null);
  useEffect(() => {
    try {
      enabled.current = localStorage.getItem("attendance-scan-sound") !== "off";
      setSoundEnabled(enabled.current);
    } catch {}
    return () => {
      if (context.current) {
        context.current.onstatechange = null;
        void context.current.close().catch(() => {});
      }
    };
  }, []);
  const unlockSound = useCallback(() => {
    if (!enabled.current) return;
    try {
      const Constructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Constructor) return;
      if (!context.current || context.current.state === "closed") {
        context.current = new Constructor();
        context.current.onstatechange = () =>
          setSoundReady(context.current?.state === "running");
      }
      void context.current
        .resume()
        .then(() => setSoundReady(context.current?.state === "running"))
        .catch(() => {});
    } catch {
      /* Sound must never interrupt attendance. */
    }
  }, []);
  useEffect(() => {
    window.addEventListener("pointerdown", unlockSound);
    window.addEventListener("keydown", unlockSound);
    return () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    };
  }, [unlockSound]);
  const playSuccess = useCallback(async () => {
    if (!enabled.current) return;
    const audio = context.current;
    if (!audio || audio.state === "closed") return;
    try {
      if (audio.state !== "running") await audio.resume();
      if (
        !enabled.current ||
        context.current !== audio ||
        audio.state !== "running"
      )
        return;
      [740, 988].forEach((frequency, index) => {
        const oscillator = audio.createOscillator(),
          gain = audio.createGain(),
          start = audio.currentTime + index * 0.1;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.13, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.15);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
    } catch {}
  }, []);
  const toggleSound = useCallback(() => {
    enabled.current = !enabled.current;
    setSoundEnabled(enabled.current);
    try {
      localStorage.setItem(
        "attendance-scan-sound",
        enabled.current ? "on" : "off",
      );
    } catch {}
    if (enabled.current) unlockSound();
  }, [unlockSound]);
  return { soundEnabled, soundReady, toggleSound, unlockSound, playSuccess };
}
