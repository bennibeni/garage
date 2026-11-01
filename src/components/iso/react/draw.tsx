import * as React from "react";
import { type Flat, type LineTone, type SolidPaths, type Tone } from "../iso-kit";
import { Stage } from "./live";

interface SolidProps {
  paths: SolidPaths;
  tone?: Tone;
  crease?: Tone | "none";
  halo?: boolean;
  lit?: boolean;
  flat?: boolean;
  className?: string;
  inner?: React.ReactNode;
  children?: React.ReactNode;
}

export function Solid({ paths, tone = "hi", crease = "faint", halo = false, lit = false, flat = false, className, inner, children }: SolidProps) {
  return (
    <g className={className ? `iso-solid ${className}` : "iso-solid"} data-lit={lit ? "" : undefined} data-seamless={paths.seamless ? "" : undefined}>
      {halo ? <path className="iso-halo" d={paths.fill} /> : null}
      <path className="iso-fill" d={paths.fill} />
      {flat ? null : paths.shades.map((d, shade) => (d ? <path key={shade} className="iso-shade" data-shade={shade} d={d} /> : null))}
      {flat ? null : <path className="iso-top" d={paths.top} />}
      {crease === "none" || !paths.crease ? null : <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />}
      {crease === "none" || !paths.bevel ? null : <path className="iso-line iso-bevel" data-tone={crease} d={paths.bevel} />}
      {inner}
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
      {children}
    </g>
  );
}

interface LineProps {
  d: string;
  tone?: LineTone;
  dotted?: boolean;
  dashed?: boolean;
  flow?: boolean;
  className?: string;
  free?: boolean | "start" | "end";
}

export function Line({ d, tone = "lo", dotted = false, dashed = false, flow = false, className, free }: LineProps) {
  if (!d) return null;
  return (
    <path
      className={className ? `iso-line ${className}` : "iso-line"}
      data-tone={tone}
      data-dotted={dotted ? "" : undefined}
      data-dashed={dashed ? "" : undefined}
      data-flow={flow ? "" : undefined}
      data-free={free === true ? "" : free || undefined}
      d={d}
    />
  );
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export function Dots({ points, size = 0.5, tone = "mid", pulse = false }: { points: Array<Flat | [number, number, number]>; size?: number; tone?: Tone; pulse?: boolean }) {
  return (
    <g className="iso-dots" data-tone={tone}>
      {points.map(([x, y, alpha], index) => (
        <circle
          key={index}
          cx={tenth(x)}
          cy={tenth(y)}
          r={size}
          fillOpacity={alpha !== undefined && alpha < 1 ? Math.max(0, alpha) : undefined}
          data-pulse={pulse ? "" : undefined}
          style={pulse ? ({ "--pulse-at": `${(index * 137) % 1600}ms` } as React.CSSProperties) : undefined}
        />
      ))}
    </g>
  );
}

export function FaceText({
  transform,
  children,
  size = 3,
  tone = "mid",
  anchor = "start",
}: {
  transform: string;
  children: React.ReactNode;
  size?: number;
  tone?: Tone;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text className="iso-face-text" data-tone={tone} transform={transform} fontSize={size} textAnchor={anchor}>
      {children}
    </text>
  );
}

interface IsoFigureProps {
  width: number;
  height: number;
  label: string;
  className?: string;
  children: React.ReactNode;
}

export function IsoFigure({ width, height, label, className, children }: IsoFigureProps) {
  return (
    <Stage className={className ? `iso-stage ${className}` : "iso-stage"}>
      <svg className="iso-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} focusable="false">
        {children}
      </svg>
    </Stage>
  );
}
