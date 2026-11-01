import { cylinder, extrude, iso, lineOnTop, ringOf, ringSeam, towardViewer, type Flat, type Plane, type SolidPaths } from "../iso/iso-kit";

import { CAR_L, CAR_W, PLATFORM_LENGTH, PLATFORM_WIDTH, LIFT, ROOF_R, ROOF_Z, T1, T2, TABLE_R, TRACK, WALL_X, type State } from "./model";

import { SLOT_COUNT, SLOT_ENTRY_X, SLOT_HEADING, slotCentre, type CarRecord } from "./parking";

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
  roof: SolidPaths;
  details: Record<"windows" | "reflections" | "wheels" | "rims" | "trim", string>;

}



function carOf(state: State): CarFrame {

  const [cx, cy] = state.car;

  const heading = state.heading;

  const dz = state.lift + (state.carElevation ?? 0) + (state.roof ? DECK_Z : 0);

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

  const project = (u: number, v: number, z: number): Flat => {
    const [x, y] = rotate(cx, cy, heading, [u, v]);
    return iso([x, y, z + dz], P);
  };
  const face = (points: [number, number, number][]) => pointsPath(points.map(([u, v, z]) => project(u, v, z))) + "Z";
  const side = (-Math.sin(heading) * view[0] + Math.cos(heading) * view[1]) >= 0 ? 1 : -1;
  const glassV = side * 15.05;
  const windows = [[-22, -8], [-5, 10]].map(([a, b]) => face([[a, glassV, BODY_TOP + 2], [b, glassV, BODY_TOP + 2], [b, glassV, CABIN_TOP - 2], [a, glassV, CABIN_TOP - 2]])).join("");
  const wheelCircle = (u: number, radius: number) => face(Array.from({ length: 20 }, (_, i) => {
    const a = i / 20 * Math.PI * 2;
    return [u + Math.cos(a) * radius, side * 18.05, CAR_Z + 6 + Math.sin(a) * radius];
  }));
  const trim = [-1, 1].map((end) => pointsPath([-12, 12].map((v) => project(end * 41, v, BODY_Z + 2)))).join("")
    + pointsPath([project(-6.5, side * 18.05, BODY_Z + 1), project(-6.5, side * 18.05, BODY_TOP - 1)])
    + [-14, 3].map((u) => pointsPath([project(u, side * 18.1, BODY_TOP - 2), project(u + 4, side * 18.1, BODY_TOP - 2)])).join("");

  return {

    halo: extrude(place(localRing(-CAR_L / 2 - 2, CAR_L / 2 + 2, -CAR_W / 2 - 2, CAR_W / 2 + 2, 9, 4)), dz, 0.1, P).fill,

    tires,
    roof: extrude(place(localRing(-18, 6, -12, 12, 3, 3)), CABIN_TOP + dz - 0.1, 0.8, P, { convex: true, bevel: 0.25 }),
    details: {
      windows,
      reflections: [-19, -2].map((u) => pointsPath([project(u, glassV, BODY_TOP + 3), project(u + 5, glassV, CABIN_TOP - 3)])).join(""),
      wheels: [-27, 27].map((u) => wheelCircle(u, 5.8)).join(""),
      rims: [-27, 27].map((u) => wheelCircle(u, 2.9)).join(""),
      trim,
    },

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



// Low trolley follows an L-shaped floor guide behind the row and along transit.
// A rigid deck carries the car flush with the stall rails.
export function armOf(state: State): SolidPaths[] {
  const { car: [x, y], heading } = state.arm;
  const nose = CAR_L / 2 + 6;
  const [wx, wy] = rotate(x, y, heading, [nose, 0]);
  const base = ROOF_Z + DECK_Z;
  const top = base;
  const guideX = SLOT_ENTRY_X - nose;
  const guideY = slotCentre(1)[1];
  const box = (x0: number, x1: number, y0: number, y1: number, z: number, height: number) =>
    extrude(localRing(x0, x1, y0, y1, 0, 1), z, height, P, { convex: true });
  return [
    box(guideX - 2, guideX + 2, guideY - 8, LIFT[1] + 2, ROOF_Z, 0.5),
    box(wx - 3, wx + 3, wy - 7, wy + 7, base, 4),
    ...[-1, 1].map((side) => cylinder(wx, wy + side * 5, 2, base, 1, P, 12)),
    extrude(localRing(-PLATFORM_LENGTH / 2, PLATFORM_LENGTH / 2, -PLATFORM_WIDTH / 2, PLATFORM_WIDTH / 2, 2, 3).map((point) => rotate(x, y, heading, point)), top - 1.6, 1.6, P, { convex: true, bevel: 0.3 }),
    extrude(localRing(PLATFORM_LENGTH / 2 - 1, nose + 2, -4, 4, 0, 1).map((point) => rotate(x, y, heading, point)), top - 1.6, 1.6, P, { convex: true }),
  ];
}

// Raccords sit flush with both rail heads. Stops rise only during transport.
function exchangeOf(state: State): SolidPaths[] {
  const [x, y] = state.arm.car;
  const top = ROOF_Z + DECK_Z + RAIL_H;
  const bridge = state.exchange ? 9 * state.exchange.liftBridge + 11 * state.exchange.parkingBridge : 0;
  const start = x + PLATFORM_LENGTH / 2 - 1;
  const latch = state.exchange?.latch ?? 0;
  const box = (x0: number, x1: number, y0: number, y1: number, z: number, height: number) =>
    extrude(localRing(x0, x1, y0, y1, 0, 1), z, height, P, { convex: true });
  return [
    ...[-1, 1].map((side) => box(start, start + 0.1 + bridge, y + side * TRACK / 2 - RAIL_W / 2, y + side * TRACK / 2 + RAIL_W / 2, top - 0.5, 0.5)),
    ...[-1, 1].map((side) => box(x - 20.5, x - 18.5, y + side * TRACK / 2 - 2.5, y + side * TRACK / 2 + 2.5, top - 0.4, 0.4 + 3 * latch)),
  ];
}

export interface Frame {

  car: CarFrame;

  arm: SolidPaths[];
  platformRails: DeckFrame;
  exchange: SolidPaths[];
  brake: boolean;

  shown: number;

  carY: number;

  inside: boolean;

  deck1: DeckFrame;

  deck2: DeckFrame;

  deck3: DeckFrame;

  roof: boolean;

  clipCar: boolean;

  colore: number;

  slots: (CarRecord | null)[];

}



export function frameOf(state: State): Frame {

  return {

    car: carOf(state),

    arm: armOf(state),
    exchange: exchangeOf(state),
    brake: state.exchange?.brake ?? true,
    platformRails: { ...deckOf(state.arm.car, state.arm.heading, PLATFORM_LENGTH / 2, ROOF_Z), teeth: "" },

    shown: state.shown,

    carY: state.car[1],

    inside: !state.roof && state.car[0] < WALL_X + CAR_L / 2 + 2,

    deck1: deckOf(T1, state.table1),

    deck2: deckOf(T2, state.table2),

    deck3: deckOf(LIFT, state.table3, ROOF_R, state.lift, true),

    roof: state.roof,

    clipCar: state.roof && state.stage !== "parking" && state.stage !== "deparking",

    colore: state.colore,

    slots: state.slots,

  };

}



export const PARKED: CarFrame[] = Array.from({ length: SLOT_COUNT }, (_, index) =>

  carOf({ car: slotCentre(index + 1), heading: SLOT_HEADING, lift: ROOF_Z, roof: true } as State),

);

