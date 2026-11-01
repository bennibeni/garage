"use client";

import * as React from "react";
import { IsoFigure, Solid } from "../iso/react/draw";
import { useInView, useLoop, useReadout, useStillness } from "../iso/react/live";
import type { SolidPaths } from "../iso/iso-kit";
import { PARKED, frameOf, type CarFrame, type DeckFrame, type Frame } from "./frame";
import { CYCLE, REST_TIME, eventOf, readoutOf, stateAt } from "./model";
import { HEIGHT, WIDTH } from "./view";
import { SIGN_ART } from "./geometry";

interface Props {
  label: string;
  floor: React.ReactNode;
  tunnels: React.ReactNode;
  building: React.ReactNode;
  roof: React.ReactNode;
  stalls: React.ReactNode;
  hatchClip: string;
  maskA: string[];
  maskB: string[];
  railsA: React.ReactNode;
  railsB: React.ReactNode;
  tables: React.ReactNode;
  hubs: React.ReactNode;
  motors: React.ReactNode;
  bollards: { y: number; element: React.ReactElement }[];
}

type Nodes = Map<string, SVGElement>;
type Bind = (key: string) => (node: SVGElement | null) => void;

const REST = frameOf(stateAt(REST_TIME));
const SPEEDS = [0.5, 1, 2, 4];
const PLAYBACK = 4;

function SolidView({ name, paths, bind, tone = "hi", lit = false }: { name: string; paths: SolidPaths; bind: Bind; tone?: string; lit?: boolean }) {
  return (
    <g className="iso-solid" data-lit={lit ? "" : undefined}>
      <path ref={bind(`${name}.fill`)} className="iso-fill" d={paths.fill} />
      {[0, 1, 2, 3].map((shade) => (
        <path key={shade} ref={bind(`${name}.shade${shade}`)} className="iso-shade" data-shade={shade} d={paths.shades[shade] ?? ""} />
      ))}
      <path ref={bind(`${name}.top`)} className="iso-top" d={paths.top} />
      <path ref={bind(`${name}.crease`)} className="iso-line iso-crease" data-tone="faint" d={paths.crease} />
      <path ref={bind(`${name}.bevel`)} className="iso-line iso-bevel" data-tone="faint" d={paths.bevel ?? ""} />
      <path ref={bind(`${name}.edge`)} className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
    </g>
  );
}

function writeSolid(nodes: Nodes, name: string, paths: SolidPaths) {
  const set = (key: string, d: string) => nodes.get(`${name}.${key}`)?.setAttribute("d", d);
  set("fill", paths.fill);
  for (let shade = 0; shade < 4; shade++) set(`shade${shade}`, paths.shades[shade] ?? "");
  set("top", paths.top);
  set("crease", paths.crease);
  set("bevel", paths.bevel ?? "");
  set("edge", paths.outline);
}

function DeckView({ name, deck, bind }: { name: string; deck: DeckFrame; bind: Bind }) {
  return (
    <g className="gr-c-rail">
      {deck.disc ? (
        <g className="gr-c-deck">
          <SolidView name={`${name}.disc`} paths={deck.disc} bind={bind} tone="mid" />
        </g>
      ) : null}
      <path ref={bind(`${name}.teeth`)} className="iso-line" data-tone="lo" d={deck.teeth} />
      {deck.rails.map((paths, index) => (
        <SolidView key={index} name={`${name}.rail${index}`} paths={paths} bind={bind} tone="mid" />
      ))}
      <g ref={bind(`${name}.bolts`)}>
        {deck.bolts.map(([x, y], index) => (
          <circle key={index} className="gr-dot" cx={x} cy={y} r={0.4} />
        ))}
      </g>
    </g>
  );
}

function CarDetails({ car, bind }: { car: CarFrame; bind?: Bind }) {
  return <>
    <g className="gr-c-car">
      {bind ? <SolidView name="car.roof" paths={car.roof} bind={bind} lit /> : <Solid paths={car.roof} lit />}
    </g>
    {Object.entries(car.details).map(([key, d]) => <path key={key} ref={bind?.(`car.detail.${key}`)} className={`gr-car-${key}`} d={d} />)}
  </>;
}

function ParkedCar({ car }: { car: CarFrame }) {
  return (
    <>
      <path className="iso-halo" d={car.halo} />
      <g className="gr-c-tire">
        {car.tires.map((paths, index) => (
          <Solid key={index} paths={paths} tone="hi" />
        ))}
      </g>
      <g className="gr-c-car">
        <Solid paths={car.body} lit inner={<path className="iso-line" data-tone="mid" d={car.bodySeam} />} />
        <path className="iso-line" data-tone="faint" d={car.hood} />
      </g>
      <g className="gr-c-glass">
        <Solid paths={car.cabin} tone="hi" inner={<path className="iso-line" data-tone="mid" d={car.cabinSeam} />} />
      </g>
      <CarDetails car={car} />
      {car.lights.map(([x, y], index) => (
        <circle key={index} className="gr-light" data-rear={car.lightsLit ? undefined : ""} cx={x} cy={y} r={1.1} />
      ))}
    </>
  );
}

function writeDeck(nodes: Nodes, name: string, deck: DeckFrame) {
  if (deck.disc) writeSolid(nodes, `${name}.disc`, deck.disc);
  nodes.get(`${name}.teeth`)?.setAttribute("d", deck.teeth);
  deck.rails.forEach((paths, index) => writeSolid(nodes, `${name}.rail${index}`, paths));
  const dots = nodes.get(`${name}.bolts`)?.children;
  if (dots) deck.bolts.forEach(([x, y], index) => {
    dots[index]?.setAttribute("cx", String(Math.round(x * 10) / 10));
    dots[index]?.setAttribute("cy", String(Math.round(y * 10) / 10));
  });
}

function write(nodes: Nodes, frame: Frame) {
  writeDeck(nodes, "deck1", frame.deck1);
  writeDeck(nodes, "deck2", frame.deck2);
  writeDeck(nodes, "deck3", frame.deck3);
  writeDeck(nodes, "platform", frame.platformRails);
  frame.arm.forEach((paths, index) => writeSolid(nodes, `arm${index}`, paths));
  frame.exchange.forEach((paths, index) => writeSolid(nodes, `exchange${index}`, paths));
  const brakeLight = nodes.get("platform.brake")?.firstElementChild;
  brakeLight?.setAttribute("cx", String(frame.platformRails.bolts[0][0]));
  brakeLight?.setAttribute("cy", String(frame.platformRails.bolts[0][1]));
  nodes.get("platform.brake")?.setAttribute("data-locked", String(frame.brake));
  const car = frame.car;
  nodes.get("car.halo")?.setAttribute("d", car.halo);
  car.tires.forEach((paths, index) => writeSolid(nodes, `car.tire${index}`, paths));
  writeSolid(nodes, "car.body", car.body);
  writeSolid(nodes, "car.cabin", car.cabin);
  writeSolid(nodes, "car.roof", car.roof);
  Object.entries(car.details).forEach(([key, d]) => nodes.get(`car.detail.${key}`)?.setAttribute("d", d));
  nodes.get("car.bodySeam")?.setAttribute("d", car.bodySeam);
  nodes.get("car.cabinSeam")?.setAttribute("d", car.cabinSeam);
  nodes.get("car.hood")?.setAttribute("d", car.hood);
  car.lights.forEach(([x, y], index) => {
    const dot = nodes.get(`car.light${index}`);
    dot?.setAttribute("cx", String(Math.round(x * 10) / 10));
    dot?.setAttribute("cy", String(Math.round(y * 10) / 10));
    if (car.lightsLit) dot?.removeAttribute("data-rear");
    else dot?.setAttribute("data-rear", "");
  });
  const free = frame.slots.filter((occupant) => !occupant).length;
  const sign = nodes.get("sign");
  if (sign) {
    const text = free ? `LIBERI ${free}` : "COMPLETO";
    if (sign.textContent !== text) sign.textContent = text;
    sign.setAttribute("data-full", free ? "false" : "true");
  }
  frame.slots.forEach((occupant, index) => {
    const slot = nodes.get(`slot${index}`);
    if (!slot) return;
    slot.setAttribute("display", occupant ? "inline" : "none");
    if (occupant) slot.setAttribute("data-color", String(occupant.colore));
  });
  const group = nodes.get("car");
  group?.setAttribute("data-color", String(frame.colore));
  group?.setAttribute("opacity", String(Math.round(frame.shown * 100) / 100));
  group?.setAttribute("visibility", frame.shown > 0.005 ? "visible" : "hidden");
  if (frame.clipCar) group?.setAttribute("clip-path", `url(#${group.dataset.mask}-hatch)`);
  else group?.removeAttribute("clip-path");
  if (frame.inside) group?.setAttribute("mask", `url(#${group.dataset.mask}-${frame.carY < 60 ? "a" : "b"})`);
  else group?.removeAttribute("mask");

}

export function GarageLive(props: Props) {
  const id = React.useId().replace(/:/g, "");
  const { anchor, say } = useReadout<HTMLDivElement>();
  const inView = useInView(anchor);
  const still = useStillness();
  const nodes = React.useRef<Nodes>(new Map());
  const clock = React.useRef({ time: REST_TIME, speed: 1, paused: false });
  const playing = React.useRef(false);
  const [forced, setForced] = React.useState(false);

  const tell = React.useCallback(
    (text: string) => {
      const slot = anchor.current?.closest(".iso-plate")?.querySelector("[data-event]");
      if (slot && slot.textContent !== text) slot.textContent = text;
    },
    [anchor],
  );

  const bind = React.useCallback<Bind>(
    (key) => (node) => {
      if (node) nodes.current.set(key, node);
      else nodes.current.delete(key);
    },
    [],
  );

  const kick = useLoop((dt, calm) => {
    const now = clock.current;
    if (calm && !playing.current) {
      const rest = stateAt(REST_TIME);
      write(nodes.current, frameOf(rest));
      say(readoutOf(rest));
      tell(eventOf(rest));
      return false;
    }
    if (!now.paused) now.time = (now.time + dt * now.speed * PLAYBACK) % CYCLE;
    const state = stateAt(now.time);
    write(nodes.current, frameOf(state));
    const pace = now.speed === 1 ? "" : ` · ×${String(now.speed).replace(".", ",")}`;
    say(readoutOf(state) + pace + (now.paused ? " · in pausa" : ""));
    tell(eventOf(state));
    return !now.paused;
  }, inView && (!still || forced));

  const toggle = () => {
    if (still && !playing.current) {
      playing.current = true;
      clock.current.paused = false;
      setForced(true);
      return;
    }
    clock.current.paused = !clock.current.paused;
    kick();
  };

  const pace = (step: number) => {
    const index = SPEEDS.indexOf(clock.current.speed);
    clock.current.speed = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, index + step))];
    kick();
  };

  const mask = `${id}-wall`;

  return (
    <div
      ref={anchor}
      className="gr"
      tabIndex={0}
      role="button"
      aria-roledescription="simulazione"
      aria-label="Garage automatico. Clic o spazio per mettere in pausa, frecce sinistra e destra per cambiare la velocità."
      onPointerDown={toggle}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") toggle();
        else if (event.key === "ArrowRight" || event.key === "ArrowUp") pace(1);
        else if (event.key === "ArrowLeft" || event.key === "ArrowDown") pace(-1);
        else return;
        event.preventDefault();
      }}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={props.label}>
        <defs>
          {(["a", "b"] as const).map((side) => (
            <mask key={side} id={`${mask}-${side}`} maskUnits="userSpaceOnUse" x={-WIDTH} y={-HEIGHT} width={WIDTH * 3} height={HEIGHT * 3}>
              <rect x={-WIDTH} y={-HEIGHT} width={WIDTH * 3} height={HEIGHT * 3} fill="white" />
              {(side === "a" ? props.maskA : props.maskB).map((d, index) => (
                <path key={index} d={d} fill="black" />
              ))}
            </mask>
          ))}
          <clipPath id={`${mask}-hatch`}>
            <path d={props.hatchClip} />
          </clipPath>
        </defs>
        {props.floor}
        {props.tunnels}
        {props.building}
        <text
          ref={bind("sign")}
          className="gr-sign"
          transform={SIGN_ART.text}
          textAnchor="middle"
          data-full={REST.slots.some((occupant) => !occupant) ? "false" : "true"}
        >
          {REST.slots.some((occupant) => !occupant) ? `LIBERI ${REST.slots.filter((occupant) => !occupant).length}` : "COMPLETO"}
        </text>
        {props.roof}
        {props.stalls}
        <g className="gr-c-yellow" aria-label="Carrello su guida con piattaforma di trasferimento">
          {REST.arm.map((paths, index) => (
            <SolidView key={index} name={`arm${index}`} paths={paths} bind={bind} tone="hi" />
          ))}
        </g>
        <DeckView name="platform" deck={REST.platformRails} bind={bind} />
        <g className="gr-c-rail" aria-label="Raccordi retrattili e fermi di sicurezza">
          {REST.exchange.map((paths, index) => <SolidView key={index} name={`exchange${index}`} paths={paths} bind={bind} tone="hi" />)}
        </g>
        <g ref={bind("platform.brake")} data-locked={String(REST.brake)} className="gr-platform-brake">
          <circle cx={REST.platformRails.bolts[0][0]} cy={REST.platformRails.bolts[0][1]} r={1.2} />
        </g>
        {/* Parked cars must occlude the transfer platform behind them. */}
        {PARKED.map((car, index) => (
          <g
            key={`slot${index}`}
            ref={bind(`slot${index}`)}
            className="gr-parked"
            display={REST.slots[index] ? "inline" : "none"}
            data-color={REST.slots[index]?.colore ?? 0}
          >
            <ParkedCar car={car} />
          </g>
        ))}
        <g clipPath={`url(#${mask}-hatch)`}>
          <DeckView name="deck3" deck={REST.deck3} bind={bind} />
        </g>
        <g mask={`url(#${mask}-a)`}>{props.railsA}</g>
        <g mask={`url(#${mask}-b)`}>{props.railsB}</g>
        {props.tables}
        <DeckView name="deck1" deck={REST.deck1} bind={bind} />
        <DeckView name="deck2" deck={REST.deck2} bind={bind} />
        {props.hubs}
        {props.bollards.map((item, index) => (
          <g key={`b${index}`}>
            {item.element}
          </g>
        ))}
        <g
          ref={bind("car")}
          className="gr-car"
          data-mask={mask}
          data-color={REST.colore}
          opacity={REST.shown}
          visibility={REST.shown > 0.005 ? "visible" : "hidden"}
          mask={REST.inside ? `url(#${mask}-${REST.carY < 60 ? "a" : "b"})` : undefined}
          clipPath={REST.clipCar ? `url(#${mask}-hatch)` : undefined}
        >
          <path ref={bind("car.halo")} className="iso-halo" d={REST.car.halo} />
          <g className="gr-c-tire">
            {REST.car.tires.map((paths, index) => (
              <SolidView key={index} name={`car.tire${index}`} paths={paths} bind={bind} tone="hi" />
            ))}
          </g>
          <g className="gr-c-car">
            <SolidView name="car.body" paths={REST.car.body} bind={bind} lit />
            <path ref={bind("car.bodySeam")} className="iso-line" data-tone="mid" d={REST.car.bodySeam} />
            <path ref={bind("car.hood")} className="iso-line" data-tone="faint" d={REST.car.hood} />
          </g>
          <g className="gr-c-glass">
            <SolidView name="car.cabin" paths={REST.car.cabin} bind={bind} tone="hi" />
            <path ref={bind("car.cabinSeam")} className="iso-line" data-tone="mid" d={REST.car.cabinSeam} />
          </g>
          <CarDetails car={REST.car} bind={bind} />
          {REST.car.lights.map(([x, y], index) => (
            <circle key={index} ref={bind(`car.light${index}`)} className="gr-light" data-rear={REST.car.lightsLit ? undefined : ""} cx={x} cy={y} r={1.1} />
          ))}
        </g>
        {props.motors}
      </IsoFigure>
    </div>
  );
}
