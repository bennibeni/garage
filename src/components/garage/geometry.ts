import {
  corners,
  cylinder,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  onTop,
  pointsAt,
  ring,
  sideArc,
  sideMatrix,
  sideSeam,
  slabOf,
  topMatrix,
  type Plan,
  type Point3,
} from "../iso/iso-kit";
import { LIFT, ROOF_R, ROOF_Z, T1, T2, TABLE_R, TRACK, WALL_X } from "./model";
import { SLOT_COUNT, SLOT_WIDTH, SLOT_X0, SLOT_X1, SLOT_Y0, slotCentre } from "./parking";
import {
  DECK_Z,
  DOOR_H,
  DOOR_HALF,
  FLOOR,
  FLOOR_Z,
  MOTOR,
  MOTOR_H,
  P,
  PINION_R,
  PIT_R,
  RAIL_END,
  RAIL_H,
  RAIL_START,
  RAIL_W,
  WALL_H,
  WALL_Y0,
  WALL_Y1,
} from "./view";

const slab = (plan: Plan, z0: number, z1: number, steps = 3, bevel = 0) => slabOf(plan, z0, z1 - z0, P, steps, bevel);
const post = (x: number, y: number, r: number, z0: number, z1: number, steps = 24, bevel = 0) => cylinder(x, y, r, z0, z1 - z0, P, steps, bevel);
const join = (paths: string[]) => paths.join("");
const box = (x0: number, x1: number, y0: number, y1: number): Plan => ({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), d: Math.abs(y1 - y0), r: 0 });

const DOORS = [T1[1], T2[1]];

export const FLOOR_ART = {
  halo: haloOf(insetPlan(FLOOR, -4), FLOOR_Z, 2, P),
  slab: slab(FLOOR, FLOOR_Z, 0, 8, 1.2),
  seam: sideSeam(FLOOR, FLOOR_Z + 3, P, 8),
  joints: join([-60, 20, 100].map((x) => lineOnTop([x, FLOOR.y], [x, FLOOR.y + FLOOR.d], 0, P)).concat([lineOnTop([WALL_X, 60], [FLOOR.x + FLOOR.w, 60], 0, P)])),
  screws: pointsAt(corners(FLOOR, 7).map(([x, y]) => [x, y, 0] as Point3), P),
  screwRings: join(corners(FLOOR, 7).map(([x, y]) => ring(x, y, 1.4, 0, P, 16))),
  tunnelFloors: DOORS.map((y) => slab(box(FLOOR.x, WALL_X, y - DOOR_HALF, y + DOOR_HALF), 0, 0.2, 2)),
  tunnelBacks: DOORS.map((y) => slab(box(FLOOR.x, FLOOR.x + 3, y - DOOR_HALF, y + DOOR_HALF), 0, DOOR_H, 2)),
};

const WX0 = FLOOR.x;
const PIERS: [number, number][] = [
  [WALL_Y0, DOORS[0] - DOOR_HALF],
  [DOORS[0] + DOOR_HALF, DOORS[1] - DOOR_HALF],
  [DOORS[1] + DOOR_HALF, WALL_Y1],
];

const pierSlab = ([y0, y1]: [number, number]) => slab(box(WX0, WALL_X, y0, y1), 0, WALL_H, 2);
const lintelSlab = (y: number) => slab(box(WX0, WALL_X, y - DOOR_HALF, y + DOOR_HALF), DOOR_H, WALL_H, 2);
export const WALL_ART = {
  piers: PIERS.map(pierSlab),
  lintels: DOORS.map(lintelSlab),
  coping: slab(box(WX0 - 1.5, WALL_X + 1.5, WALL_Y0 - 1.5, WALL_Y1 + 1.5), WALL_H, WALL_H + 3, 2, 0.6),
  plinth: PIERS.map(([y0, y1]) => slab(box(WALL_X, WALL_X + 1.6, y0, y1), 0, 5, 2)),
  frames: DOORS.map((y) => slab(box(WALL_X, WALL_X + 1.6, y - DOOR_HALF - 3, y + DOOR_HALF + 3), DOOR_H, DOOR_H + 3, 2)),
  rules: PIERS.map(([y0, y1]) => [24, 47].map((z) => sideSeam(box(WX0, WALL_X, y0, y1), z, P, 2)).join("")),
  roofRules: join([-150, -170, -190].map((x) => lineOnTop([x, WALL_Y0 - 1.5], [x, WALL_Y1 + 1.5], WALL_H + 3, P))),
};

const railPlans = (cx: number | null, cy: number | null): Plan[] => {
  if (cy !== null) return [-1, 1].map((side) => box(RAIL_START, RAIL_END, cy + side * (TRACK / 2) - RAIL_W / 2, cy + side * (TRACK / 2) + RAIL_W / 2));
  const y0 = T1[1] + TABLE_R + 0.6;
  const y1 = T2[1] - TABLE_R - 0.6;
  return [-1, 1].map((side) => box(cx! + side * (TRACK / 2) - RAIL_W / 2, cx! + side * (TRACK / 2) + RAIL_W / 2, y0, y1));
};

const RAILS_IN = railPlans(null, T1[1]);
const RAILS_OUT = railPlans(null, T2[1]);
const RAILS_CROSS = railPlans(T1[0], null);

function boltsOn(plan: Plan, step = 14): Point3[] {
  const out: Point3[] = [];
  const along = plan.w > plan.d;
  const length = along ? plan.w : plan.d;
  for (let at = 6; at < length - 3; at += step) out.push(along ? [plan.x + at, plan.y + plan.d / 2, RAIL_H] : [plan.x + plan.w / 2, plan.y + at, RAIL_H]);
  return out;
}

function chevron(x: number, y: number, dir: 1 | -1) {
  const points: [number, number][] = [
    [x - dir * 4, y - 8],
    [x + dir * 4, y],
    [x - dir * 4, y + 8],
    [x - dir * 7, y + 8],
    [x + dir * 1, y],
    [x - dir * 7, y - 8],
  ];
  return onTop(points, 0, P, true);
}

export const RAIL_ART = {
  far: [...RAILS_OUT].map((plan) => slab(plan, 0, RAIL_H, 2)),
  near: [...RAILS_IN].map((plan) => slab(plan, 0, RAIL_H, 2)),
  cross: RAILS_CROSS.map((plan) => slab(plan, 0, RAIL_H, 2)),
  boltsFar: pointsAt(RAILS_OUT.flatMap((plan) => boltsOn(plan)), P),
  boltsNear: pointsAt(RAILS_IN.flatMap((plan) => boltsOn(plan)), P),
  arrowsIn: join([-70, -40].map((x) => chevron(x, T1[1], 1))),
  arrowsOut: join([-40, -70].map((x) => chevron(x, T2[1], -1))),
};

function tableArt([cx, cy]: [number, number]) {
  return {
    pit: slab({ x: cx - PIT_R, y: cy - PIT_R, w: PIT_R * 2, d: PIT_R * 2, r: PIT_R }, -0.2, 0, 16),
    pitRing: ring(cx, cy, PIT_R + 2.2, 0, P, 96),
    deck: post(cx, cy, TABLE_R, -2, DECK_Z, 96, 0.8),
    groove: ring(cx, cy, TABLE_R - 8, DECK_Z, P, 96),
    hub: post(cx, cy, 6, DECK_Z, DECK_Z + 1.2, 32, 0.4),
    hubDot: pointsAt([[cx, cy, DECK_Z + 1.2]], P),
  };
}

export const TABLE_ART = { far: tableArt(T2), near: tableArt(T1) };

function motorArt(cy: number) {
  const plan = { ...MOTOR, y: cy + MOTOR.y };
  const pinionX = T1[0] + TABLE_R + PINION_R + 0.2;
  return {
    halo: haloOf(plan, 0, 2, P),
    body: slab(plan, 0, MOTOR_H, 3, 0.6),
    seam: sideSeam(plan, 3, P, 3),
    fins: join([4, 7, 10, 13].map((dx) => lineOnTop([plan.x + dx, plan.y], [plan.x + dx, plan.y + plan.d], MOTOR_H, P))),
    screws: pointsAt(corners(plan, 1.8).map(([x, y]) => [x, y, MOTOR_H] as Point3), P),
    shaft: post(pinionX + 1, cy, 1.4, 1.6, 3.2, 12),
    pinion: post(pinionX, cy, PINION_R, DECK_Z, DECK_Z + 3.4, 24),
    pinionTeeth: knurl(pinionX, cy, PINION_R, DECK_Z, DECK_Z + 3.4, 16, P, 0.3),
    gland: post(plan.x + plan.w, cy + 5, 1.8, 4, 8, 14),
  };
}

export const MOTOR_ART = { far: motorArt(T2[1]), near: motorArt(T1[1]) };

const BOLLARDS: [number, number][] = DOORS.flatMap((y) => [[WALL_X + 10, y + DOOR_HALF + 8] as [number, number], [WALL_X + 10, y - DOOR_HALF - 8] as [number, number]]);

export const BOLLARD_ART = BOLLARDS.map(([x, y]) => ({
  y,
  body: post(x, y, 3, 0, 20, 24, 0.4),
  bands: sideArc(x, y, 3, 14, P, 24) + sideArc(x, y, 3, 17, P, 24),
}));

export const DOOR_YS = DOORS;
export const PIER_SPANS = PIERS;

function hull(points: [number, number][]) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

const HATCH_R = ROOF_R + 1;
const hatchRing = (z: number) => Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  return [LIFT[0] + Math.cos(a) * HATCH_R, LIFT[1] + Math.sin(a) * HATCH_R, z] as Point3;
});

export const ROOF_ART = {
  shaft: post(LIFT[0], LIFT[1], HATCH_R, ROOF_Z - 0.2, ROOF_Z, 96),
  rim: ring(LIFT[0], LIFT[1], HATCH_R + 2.4, ROOF_Z, P, 96),
  clip: `M${hull(pointsAt([...hatchRing(ROOF_Z), ...hatchRing(ROOF_Z + 60)], P) as [number, number][]).map(([x, y]) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`).join("L")}Z`,
};

const SLOT_Y1 = SLOT_Y0 + SLOT_COUNT * SLOT_WIDTH;
const CURB: Plan = { x: SLOT_X0 - 3, y: SLOT_Y0, w: 3, d: SLOT_Y1 - SLOT_Y0, r: 0.8 };

export const STALL_ART = {
  curb: slab(CURB, ROOF_Z, ROOF_Z + 1.6, 2, 0.3),
  lines: join(
    Array.from({ length: SLOT_COUNT + 1 }, (_, index) => SLOT_Y0 + index * SLOT_WIDTH).map((y) => lineOnTop([SLOT_X0, y], [SLOT_X1, y], ROOF_Z, P)),
  ) + lineOnTop([SLOT_X1, SLOT_Y0], [SLOT_X1, SLOT_Y1], ROOF_Z, P),
  numbers: Array.from({ length: SLOT_COUNT }, (_, index) => {
    const [, y] = slotCentre(index + 1);
    return { label: String(index + 1), transform: topMatrix([SLOT_X1 + 9, y], ROOF_Z, P, "x") };
  }),
};

const SIGN: Plan = { x: WALL_X, y: 34, w: 2.5, d: 52, r: 0.6 };
export const SIGN_FACE_X = SIGN.x + SIGN.w;

export const SIGN_ART = {
  panel: slab(SIGN, 51, 65, 2, 0.4),
  screws: pointsAt([[SIGN_FACE_X, SIGN.y + 3, 62.5], [SIGN_FACE_X, SIGN.y + SIGN.d - 3, 62.5], [SIGN_FACE_X, SIGN.y + 3, 53.5], [SIGN_FACE_X, SIGN.y + SIGN.d - 3, 53.5]], P),
  text: sideMatrix([SIGN_FACE_X, SIGN.y + SIGN.d / 2], 55.2, P, "right"),
};
