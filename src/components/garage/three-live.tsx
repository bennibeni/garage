"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useLoop, useReadout, useStillness } from "../iso/react/live";
import { CYCLE, REST_TIME, eventOf, readoutOf, stateAt } from "./model";
import type { createGarageScene } from "./three-scene";

// Imposta "svg" per usare la vista isometrica originale.
const GARAGE_VIEW: "3d" | "svg" = "3d";

export function GarageThree({ fallback }: { fallback: React.ReactNode }) {
  const [mode, setMode] = useState<"3d" | "svg">(GARAGE_VIEW);
  const [status, setStatus] = useState("Caricamento auto GLB…");
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createGarageScene> | null>(null);
  const { anchor, say } = useReadout<HTMLDivElement>();
  const inView = useInView(anchor);
  const still = useStillness();
  const [started, setStarted] = useState(false);
  const clock = useRef({ time: REST_TIME, speed: 1, paused: false });
  const kick = useLoop((dt) => {
    if (!scene.current || !ready) return false;
    const now = clock.current;
    if (!now.paused && (!still || started)) now.time = (now.time + dt * now.speed * 4) % CYCLE;
    const state = stateAt(now.time);
    scene.current.update(state);
    say(readoutOf(state) + (now.speed === 1 ? "" : ` · ×${now.speed}`) + (now.paused ? " · in pausa" : ""));
    const event = anchor.current?.closest(".iso-plate")?.querySelector("[data-event]");
    if (event) event.textContent = eventOf(state);
    return !now.paused && (!still || started);
  }, mode === "3d" && ready && inView && (!still || started));

  useEffect(() => {
    if (mode !== "3d") return;
    let cancelled = false;
    let instance: ReturnType<typeof createGarageScene> | undefined;
    import("./three-scene").then(async ({ createGarageScene }) => {
      if (cancelled || !host.current) return;
      instance = createGarageScene(host.current);
      scene.current = instance;
      instance.update(stateAt(clock.current.time));
      await instance.ready;
      if (cancelled) return;
      instance.update(stateAt(clock.current.time));
      setReady(true);
      setStatus("Berline · sportive · SUV · vista 3D");
    }).catch(() => {
      if (!cancelled) {
        setStatus("Vista 3D non disponibile. È attiva la vista SVG.");
        setMode("svg");
      }
    });
    return () => {
      cancelled = true;
      instance?.dispose();
      scene.current = null;
      setReady(false);
    };
  }, [mode]);

  const toggle = () => {
    if (still && !started) { setStarted(true); return; }
    clock.current.paused = !clock.current.paused;
    kick();
  };
  return <>
    {mode === "3d" ? <div ref={anchor} className="gr gr-three" role="button" tabIndex={0}
      aria-label="Garage 3D con auto GLB. Clic o spazio per pausa, frecce per velocità."
      onClick={toggle} onKeyDown={event => {
        if (event.key === " " || event.key === "Enter") toggle();
        else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
          const speeds = [0.5, 1, 2, 4];
          const delta = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
          clock.current.speed = speeds[Math.max(0, Math.min(3, speeds.indexOf(clock.current.speed) + delta))];
          kick();
        } else return;
        event.preventDefault();
      }}><div ref={host} className="gr-three-canvas" /></div> : fallback}
    <p className="gr-three-status" role="status">{mode === "3d" ? status : "Vista SVG"}</p>
  </>;
}
