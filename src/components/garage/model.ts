import { EPISODES, SLOT_ENTRY_X, SLOT_HEADING, slotCentre, slotEntry, type CarRecord, type Episode } from "./parking";



export const UNIT_M = 0.05;



export const CAR_L = 84;

export const CAR_W = 36;

export const TRACK = 31;



export const WALL_X = -110;

export const START_X = -186;

export const TABLE_R = 56;

export const T1: [number, number] = [40, 0];

export const T2: [number, number] = [40, 120];



export const ROOF_Z = 73;

export const ROOF_R = 48;

export const LIFT: [number, number] = [-176, T2[1]];
export const PLATFORM_LENGTH = 76;
export const PLATFORM_WIDTH = 40;
export const PLATFORM_DOCK: [number, number] = [SLOT_ENTRY_X, LIFT[1]];



export const V_MAX = 2 / UNIT_M;

export const ACCEL = 1 / UNIT_M;

export const LIFT_V = 1 / UNIT_M;

export const LIFT_A = 0.5 / UNIT_M;

export const TURN_TIME = 4;

export const PARKING_TIME = 44;

export const DEPARKING_TIME = PARKING_TIME;



export const SWAP_TIME = 2;

export const ARM_TIME = 6;







export interface ArmPose {


  car: [number, number];

  heading: number;

  carElevation: number;

}



export type Stage =

  | "in"

  | "turn1"

  | "cross"

  | "turn2"

  | "out"

  | "lift"


  | "armReady"

  | "armReturn"

  | "parking"

  | "deparking"

  | "prep"

  | "reset"

  | "lower"

  | "swap"

  | "back"

  | "turn2back"

  | "crossBack"

  | "turn1back"

  | "home";



export interface Move {

  at: number;

  speed: number;

}



export function trapezoid(distance: number, t: number, vMax = V_MAX, accel = ACCEL): Move {

  const ramp = vMax / accel;

  const full = distance >= vMax * ramp;

  const peak = full ? vMax : Math.sqrt(distance * accel);

  const up = peak / accel;

  const cruise = full ? (distance - peak * up) / peak : 0;

  const total = up * 2 + cruise;

  const time = Math.min(Math.max(t, 0), total);

  if (time < up) return { at: 0.5 * accel * time * time, speed: accel * time };

  if (time < up + cruise) return { at: 0.5 * peak * up + peak * (time - up), speed: peak };

  const left = total - time;

  return { at: distance - 0.5 * accel * left * left, speed: accel * left };

}



export function trapezoidTime(distance: number, vMax = V_MAX, accel = ACCEL) {

  const ramp = vMax / accel;

  if (distance >= vMax * ramp) return distance / vMax + ramp;

  return 2 * Math.sqrt(distance / accel);

}



const turnShare = (t: number, total: number) => {

  const u = Math.min(Math.max(t / total, 0), 1);

  return u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);

};



const RUN_IN = T1[0] - START_X;

const RUN_CROSS = T2[1] - T1[1];

const RUN_OUT = T2[0] - LIFT[0];



const LIFT_TIME = trapezoidTime(ROOF_Z, LIFT_V, LIFT_A);



const ARRIVAL: { stage: Stage; time: number }[] = [

  { stage: "in", time: trapezoidTime(RUN_IN) },

  { stage: "turn1", time: TURN_TIME },

  { stage: "cross", time: trapezoidTime(RUN_CROSS) },

  { stage: "turn2", time: TURN_TIME },

  { stage: "out", time: trapezoidTime(RUN_OUT) },

  { stage: "lift", time: LIFT_TIME },


  { stage: "armReady", time: ARM_TIME },

  { stage: "parking", time: PARKING_TIME },

  { stage: "armReturn", time: ARM_TIME },

];



const DEPARTURE: { stage: Stage; time: number }[] = [

  { stage: "lower", time: LIFT_TIME },

  { stage: "swap", time: SWAP_TIME },

  { stage: "back", time: trapezoidTime(RUN_OUT) },

  { stage: "turn2back", time: TURN_TIME },

  { stage: "crossBack", time: trapezoidTime(RUN_CROSS) },

  { stage: "turn1back", time: TURN_TIME },

  { stage: "home", time: trapezoidTime(RUN_IN) },

];



export function stagesOf(episode: Episode) {

  if (episode.tipo === "ingresso") return [...ARRIVAL, { stage: "reset" as Stage, time: LIFT_TIME }];

  return [{ stage: "prep" as Stage, time: LIFT_TIME }, { stage: "armReady" as Stage, time: ARM_TIME }, { stage: "deparking" as Stage, time: DEPARKING_TIME }, { stage: "armReturn" as Stage, time: ARM_TIME }, ...DEPARTURE];

}



const PLAN = (() => {

  let start = 0;

  return EPISODES.map((episode) => {

    const stages = stagesOf(episode);

    const time = stages.reduce((sum, item) => sum + item.time, 0);

    const item = { episode, stages, start, time };

    start += time;

    return item;

  });

})();



export const CYCLE = PLAN.reduce((sum, item) => sum + item.time, 0);



export interface State {

  stage: Stage;

  arm: ArmPose;
  exchange: Exchange | null;

  car: [number, number];

  heading: number;

  speed: number;

  lift: number;

  carElevation: number;

  roof: boolean;

  table1: number;

  table2: number;

  table3: number;

  shown: number;

  turned: number;

  numero: number;

  colore: number;

  parcheggio: number;

  tipo: Episode["tipo"];

  evento: number;

  slots: (CarRecord | null)[];

}



const HALF_PI = Math.PI / 2;

const smooth = (t: number) => {

  const u = Math.min(Math.max(t, 0), 1);

  return u * u * (3 - 2 * u);

};



function visibility(x: number) {

  return smooth((x - (WALL_X - 65)) / 25);

}



const liftShown = (z: number) => smooth((z - 22) / 34);



type Motion = Omit<State, "exchange" | "arm" | "numero" | "colore" | "parcheggio" | "slots" | "tipo" | "evento">;



function motionOf(stage: Stage, t: number, done: number): Motion {

  const base = { lift: 0, carElevation: 0, roof: false, table1: 0, table2: HALF_PI, table3: 0, turned: 0, speed: 0 };

  if (stage === "in") {

    const move = trapezoid(RUN_IN, t);

    const x = START_X + move.at;

    return { ...base, stage, car: [x, T1[1]], heading: 0, speed: move.speed, shown: visibility(x) };

  }

  if (stage === "turn1") {

    const angle = HALF_PI * turnShare(t, done);

    return { ...base, stage, car: [...T1], heading: angle, table1: angle, shown: 1, turned: angle };

  }

  if (stage === "cross") {

    const move = trapezoid(RUN_CROSS, t);

    return { ...base, stage, car: [T1[0], T1[1] + move.at], heading: HALF_PI, speed: move.speed, table1: HALF_PI, shown: 1 };

  }

  if (stage === "turn2") {

    const share = turnShare(t, done);

    return { ...base, stage, car: [...T2], heading: HALF_PI + HALF_PI * share, table1: HALF_PI, table2: HALF_PI + HALF_PI * share, shown: 1, turned: HALF_PI * share };

  }

  if (stage === "out") {

    const move = trapezoid(RUN_OUT, t);

    const x = T2[0] - move.at;

    return { ...base, stage, car: [x, T2[1]], heading: Math.PI, speed: move.speed, table1: HALF_PI, table2: Math.PI, shown: visibility(x) };

  }

  const held = { ...base, table1: HALF_PI, table2: Math.PI };

  if (stage === "lift") {

    const move = trapezoid(ROOF_Z, t, LIFT_V, LIFT_A);

    return { ...held, stage, car: [...LIFT], heading: Math.PI, speed: move.speed, lift: move.at, roof: true, shown: liftShown(move.at) };

  }

  if (stage === "prep") {

    const move = trapezoid(ROOF_Z, t, LIFT_V, LIFT_A);

    const share = turnShare(t, done);

    return { ...base, stage, car: [...LIFT], heading: SLOT_HEADING, lift: move.at, roof: true, table1: HALF_PI * share, table2: HALF_PI + HALF_PI * share, table3: 0, shown: 0 };

  }

  if (stage === "reset") {

    const move = trapezoid(ROOF_Z, t, LIFT_V, LIFT_A);

    const share = turnShare(t, done);

    return { ...base, stage, car: [...LIFT], heading: SLOT_HEADING, lift: ROOF_Z - move.at, roof: true, table1: HALF_PI * (1 - share), table2: Math.PI - HALF_PI * share, table3: 0, shown: 0 };

  }

  if (stage === "lower") {

    const move = trapezoid(ROOF_Z, t, LIFT_V, LIFT_A);

    const z = ROOF_Z - move.at;

    return { ...held, stage, car: [...LIFT], heading: SLOT_HEADING, speed: move.speed, lift: z, roof: true, table3: 0, shown: liftShown(z) };

  }

  if (stage === "swap") {

    const share = turnShare(t, done);

    return { ...held, stage, car: [...LIFT], heading: Math.PI + Math.PI * share, roof: true, table3: Math.PI * share, shown: 0, turned: Math.PI * share };

  }

  const after = { ...held, table3: Math.PI };

  if (stage === "back") {

    const move = trapezoid(RUN_OUT, t);

    const x = LIFT[0] + move.at;

    return { ...after, stage, car: [x, T2[1]], heading: 0, speed: move.speed, shown: visibility(x) };

  }

  if (stage === "turn2back") {

    const share = turnShare(t, done);

    return { ...after, stage, car: [...T2], heading: -HALF_PI * share, table2: Math.PI - HALF_PI * share, shown: 1, turned: HALF_PI * share };

  }

  if (stage === "crossBack") {

    const move = trapezoid(RUN_CROSS, t);

    return { ...after, stage, car: [T2[0], T2[1] - move.at], heading: -HALF_PI, speed: move.speed, table2: HALF_PI, shown: 1 };

  }

  if (stage === "turn1back") {

    const share = turnShare(t, done);

    return { ...after, stage, car: [...T1], heading: -HALF_PI - HALF_PI * share, table1: HALF_PI - HALF_PI * share, table2: HALF_PI, shown: 1, turned: HALF_PI * share };

  }

  const move = trapezoid(RUN_IN, t);

  const x = T1[0] - move.at;

  return { ...after, stage, car: [x, T1[1]], heading: -Math.PI, speed: move.speed, table1: 0, table2: HALF_PI, shown: visibility(x) };

}



// Zero speed and acceleration at contact avoid a jerk when taking the load.

const settle = (t: number) => {

  const u = Math.min(Math.max(t, 0), 1);

  if (u < 1e-12) return 0;
  if (u > 1 - 1e-12) return 1;
  return u * u * u * (10 + u * (-15 + 6 * u));

};



// Loaded transfers stay at rail height within the transit zone.

// The heading stays aligned with the rails; deparking retraces the path.

export interface Exchange {
  liftBridge: number;
  parkingBridge: number;
  latch: number;
  brake: boolean;
}

export function exchangeAt(progress: number): Exchange {
  const u = Math.min(Math.max(progress, 0), 1);
  return {
    liftBridge: settle(u / 0.04) * (1 - settle((u - 0.2) / 0.04)),
    parkingBridge: settle((u - 0.74) / 0.06) * (1 - settle((u - 0.96) / 0.04)),
    latch: settle((u - 0.24) / 0.02) * (1 - settle((u - 0.72) / 0.02)),
    brake: u <= 0.26 || u >= 0.72,
  };
}

export function transferAt(slot: number, progress: number) {
  const u = Math.min(Math.max(progress, 0), 1);
  const board = settle((u - 0.06) / 0.14);
  const travel = settle((u - 0.26) / 0.46);
  const roll = settle((u - 0.84) / 0.12);
  const entry = slotEntry(slot);
  const target = slotCentre(slot);
  return {
    car: [LIFT[0] + (entry[0] - LIFT[0]) * board + (target[0] - entry[0]) * roll, LIFT[1] + (entry[1] - LIFT[1]) * travel] as [number, number],
    heading: SLOT_HEADING,
    carElevation: 0,
  };
}

export function stateAt(time: number): State {

  let t = ((time % CYCLE) + CYCLE) % CYCLE;

  let index = 0;

  while (index < PLAN.length - 1 && t >= PLAN[index].start + PLAN[index].time) index++;

  const item = PLAN[index];

  t -= item.start;

  let step = 0;

  while (t > item.stages[step].time && step < item.stages.length - 1) {

    t -= item.stages[step].time;

    step++;

  }

  const { stage, time: done } = item.stages[step];

  const auxiliary = stage === "armReady" || stage === "armReturn";

  const arriving = item.episode.tipo === "ingresso";

  const transferring = stage === "parking" || stage === "deparking" || auxiliary;

  const progress = auxiliary ? (arriving && stage === "armReturn" ? 1 : 0) : stage === "parking" ? t / done : 1 - t / done;

  const motion: Motion = transferring

    ? { stage, ...transferAt(item.episode.auto.parcheggio, progress), lift: ROOF_Z, roof: true, table1: HALF_PI, table2: Math.PI, table3: 0, turned: 0, speed: 0, shown: 1 }

    : motionOf(stage, t, done);

  const { tipo, auto, prima } = item.episode;

  const slots = [...prima];

  let hidden = false;

  if (tipo === "ingresso" && (stage === "reset" || stage === "armReturn")) {

    slots[auto.parcheggio - 1] = auto;

    hidden = true;

  }

  if (tipo === "uscita" && stage !== "prep" && stage !== "armReady") slots[auto.parcheggio - 1] = null;

  if (tipo === "uscita" && stage === "armReady") hidden = true;

  const idle: ArmPose = { car: [...PLATFORM_DOCK], heading: SLOT_HEADING, carElevation: 0 };

  let arm = idle;

  if (stage === "parking" || stage === "deparking") arm = { ...transferAt(auto.parcheggio, Math.min(Math.max(progress, 0.2), 0.8)) };

  if (auxiliary) {

    const atEntry = arriving ? stage === "armReturn" : stage === "armReady";
    const endpoint = transferAt(auto.parcheggio, atEntry ? 0.8 : 0.2);

    const u = stage === "armReady" ? 1 - t / done : t / done;

    // The rigid platform returns empty along the floor guide.


    const travel = settle(u);

    arm = {


      car: endpoint.car.map((value, axis) => value + (idle.car[axis] - value) * (axis === 0 ? settle((travel - 0.7) / 0.3) : settle(travel / 0.7))) as [number, number],

      heading: endpoint.heading + (idle.heading - endpoint.heading) * travel,

      carElevation: 0,

    };

  }

  return { ...motion, arm, exchange: !auxiliary && transferring ? exchangeAt(progress) : null, shown: hidden ? 0 : motion.shown, numero: auto.numero, colore: auto.colore, parcheggio: auto.parcheggio, tipo, slots, evento: index + 1 };

}



const LABEL: Record<Stage, string> = {

  in: "Binario d'ingresso",

  turn1: "Piattaforma 1",

  cross: "Traslazione",

  turn2: "Piattaforma 2",

  out: "Binario d'uscita",

  lift: "Ascensore",


  armReady: "Posizionamento del braccio",

  armReturn: "Rientro del braccio",

  parking: "Parking",

  deparking: "Deparking",

  reset: "Piattaforma vuota in discesa",

  prep: "Piattaforma vuota in salita",

  lower: "Discesa",

  swap: "Inversione al piano inferiore",

  back: "Ritorno sul binario d'uscita",

  turn2back: "Piattaforma 2, ritorno",

  crossBack: "Traslazione di ritorno",

  turn1back: "Piattaforma 1, ritorno",

  home: "Rientro alla porta d'ingresso",

};



const decimal = (value: number, digits = 1) => value.toFixed(digits).replace(".", ",");



const TURNS: Stage[] = ["turn1", "turn2", "swap", "turn2back", "turn1back"];



function describe(state: State) {

  if (state.stage === "armReady") return "Carrello · allineamento piattaforma";

  if (state.stage === "armReturn") return "Carrello · ritorno piattaforma";

  if (state.stage === "parking") return `Parking → posto ${state.parcheggio}`;

  if (state.stage === "prep") return `${LABEL.prep} · sparcheggio del posto ${state.parcheggio}`;

  if (state.stage === "deparking") return `Deparking dal posto ${state.parcheggio}`;

  if (state.stage === "reset") return `${LABEL.reset} · posto ${state.parcheggio} occupato`;

  if (TURNS.includes(state.stage)) return `${LABEL[state.stage]} · ${Math.round((state.turned * 180) / Math.PI)}°`;

  if (state.stage === "lift" || state.stage === "lower") return `${LABEL[state.stage]} · quota ${decimal(state.lift * UNIT_M)} m`;

  return `${LABEL[state.stage]} · ${decimal(state.speed * UNIT_M)} m/s`;

}



export const eventOf = (state: State) => `Evento ${state.evento} · ${state.tipo}`;



export function readoutOf(state: State) {

  return `Auto ${state.numero} · ${describe(state)}`;

}



export const REST_TIME = ARRIVAL[0].time * 0.62;

