import { cylinder, extrude, iso, lineOnTop, ringOf, ringSeam, towardViewer, type Flat, type Plane, type SolidPaths } from "../iso/iso-kit";
import { CAR_L, CAR_W, LIFT, ROOF_R, ROOF_Z, T1, T2, TABLE_R, TRACK, WALL_X, type State } from "./model";
import { SLOT_COUNT, SLOT_HEADING, slotCentre, type CarRecord } from "./parking";
import { CAR_Z, DECK_Z, P, RAIL_H, RAIL_W } from "./view";

type Local = [number, number];

const rotate = (cx: number, cy: number, angle: number, [u, v]: Local): Plane => [cx + u * Math.cos(angle) - v * Math.sin(angle), cy + u * Math.sin(angle) + v * Math.cos(angle)];

const localRing = (u0: number, u1: number, v0: number, v1: number, r: number, steps: number): Local[] => ringOf({ x: u0, y: v0, w: u1 - u0, d: v1 - v0, r }, steps) as Local[];

const BODY = localRing(-CAR_L / 2, CAR_L / 2, -CAR_W / 2, CAR_W / 2, 7, 4);
const CABIN = localRing(-24, 12, -15, 15, 4, 3);
const HOOD = localRing(14, 40, -12, 12, 3, 2);
const TIRE = localRing(-6.5, 6.5, -2.5, 2.5, 1.2, 2);
const WHEELS: Local[] = [-27, 27].flatMap((u) => [-1, 1].map((side) => [u, side * (TRACK / 2)] as Local));
const DECK_RAIL = (side: number, radius: number) => localRing(-radius + 1, radius - 1, side * (TRACK / 2) - RAIL_W / 2, side * (TRACK / 2) + RAIL_W / 2, 0, 1);

const BODY_Z = CAR_Z + 5;
const BODY_TOP = CAR_Z + 15;
const CABIN_TOP = CAR_Z + 26;

const fine = (value: number) => Math.round(value * 10) / 10;
const pointsPath = (points: Flat[]) => `M${points.map(([x, y]) => `${fine(x)} ${fine(y)}`).join("L")}`;

export interface CarFrame {
  halo: string;
  tires: SolidPaths[];
  body: SolidPaths;
  bodySeam: string;
  hood: string;
  cabin: SolidPaths;
  cabinSeam: string;
  lights: Flat[];
  lightsLit: boolean;
}

function carOf(state: State): CarFrame {
  const [cx, cy] = state.car;
  const heading = state.heading;
  const dz = state.lift + (state.roof ? DECK_Z : 0);
  const place = (ring: Local[]) => ring.map((point) => rotate(cx, cy, heading, point));
  const view = towardViewer(P);
  const depth = ([u, v]: Local) => {
    const [x, y] = rotate(cx, cy, heading, [u, v]);
    return x * view[0] + y * view[1];
  };
  const tires = [...WHEELS]
    .sort((a, b) => depth(a) - depth(b))
    .map((wheel) => extrude(place(TIRE.map(([u, v]) => [u + wheel[0], v + wheel[1]] as Local)), CAR_Z + dz, 12, P, { convex: true }));
  const body = place(BODY);
  const cabin = place(CABIN);
  const front = [Math.cos(heading), Math.sin(heading)];
  const facing = front[0] * view[0] + front[1] * view[1];
  const lightU = facing >= 0 ? CAR_L / 2 : -CAR_L / 2;
  const lights = [-11, 11].map((v) => {
    const [x, y] = rotate(cx, cy, heading, [lightU, v]);
    return iso([x, y, BODY_Z + dz + 6], P);
  });
  return {
    halo: extrude(place(localRing(-CAR_L / 2 - 2, CAR_L / 2 + 2, -CAR_W / 2 - 2, CAR_W / 2 + 2, 9, 4)), dz, 0.1, P).fill,
    tires,
    body: extrude(body, BODY_Z + dz, BODY_TOP - BODY_Z, P, { convex: true, bevel: 0.6 }),
    bodySeam: ringSeam(body, BODY_Z + dz + 4, P),
    hood: pointsPath(place(HOOD).map(([x, y]) => iso([x, y, BODY_TOP + dz], P)).concat([iso([...place(HOOD)[0], BODY_TOP + dz], P)])),
    cabin: extrude(cabin, BODY_TOP + dz, CABIN_TOP - BODY_TOP, P, { convex: true, bevel: 0.5 }),
    cabinSeam: ringSeam(cabin, BODY_TOP + dz + 3, P),
    lights,
    lightsLit: facing >= 0,
  };
}

export interface DeckFrame {
  rails: SolidPaths[];
  teeth: string;
  bolts: Flat[];
  disc: SolidPaths | null;
}

function deckOf([cx, cy]: [number, number], angle: number, radius = TABLE_R, base = 0, disc = false): DeckFrame {
  const top = base + DECK_Z;
  const view = towardViewer(P);
  const sides = [-1, 1].sort((a, b) => {
    const pa = rotate(cx, cy, angle, [0, a]);
    const pb = rotate(cx, cy, angle, [0, b]);
    return pa[0] * view[0] + pa[1] * view[1] - (pb[0] * view[0] + pb[1] * view[1]);
  });
  const rails = sides.map((side) => extrude(DECK_RAIL(side, radius).map((point) => rotate(cx, cy, angle, point)), top, RAIL_H, P, { convex: true }));
  const teeth: string[] = [];
  for (let index = 0; index < 72; index++) {
    const a = angle + (index / 72) * Math.PI * 2;
    teeth.push(lineOnTop([cx + Math.cos(a) * (radius - 3), cy + Math.sin(a) * (radius - 3)], [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius], top, P));
  }
  const bolts: Flat[] = [];
  for (const side of [-1, 1]) {
    for (let u = -radius + 8; u <= radius - 8; u += 14) {
      const [x, y] = rotate(cx, cy, angle, [u, side * (TRACK / 2)]);
      bolts.push(iso([x, y, top + RAIL_H], P));
    }
  }
  return { rails, teeth: teeth.join(""), bolts, disc: disc ? cylinder(cx, cy, radius, top - 4, 4, P, 96, 0.8) : null };
}

export interface Frame {
  car: CarFrame;
  shown: number;
  carY: number;
  inside: boolean;
  deck1: DeckFrame;
  deck2: DeckFrame;
  deck3: DeckFrame;
  roof: boolean;
  colore: number;
  slots: (CarRecord | null)[];
}

export function frameOf(state: State): Frame {
  return {
    car: carOf(state),
    shown: state.shown,
    carY: state.car[1],
    inside: !state.roof && state.car[0] < WALL_X + CAR_L / 2 + 2,
    deck1: deckOf(T1, state.table1),
    deck2: deckOf(T2, state.table2),
    deck3: deckOf(LIFT, state.table3, ROOF_R, state.lift, true),
    roof: state.roof,
    colore: state.colore,
    slots: state.slots,
  };
}

export const PARKED: CarFrame[] = Array.from({ length: SLOT_COUNT }, (_, index) =>
  carOf({ car: slotCentre(index + 1), heading: SLOT_HEADING, lift: ROOF_Z, roof: true } as State),
);
