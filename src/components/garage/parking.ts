export const SLOT_COUNT = 5;
export const SLOT_WIDTH = 46;
export const SLOT_Y0 = -186;
export const SLOT_X0 = -316;
export const SLOT_X1 = -128;
export const SLOT_ZONE_SPLIT = (SLOT_X0 + SLOT_X1) / 2;
export const SLOT_CAR_X = (SLOT_ZONE_SPLIT + SLOT_X1) / 2;
export const SLOT_ENTRY_X = (SLOT_X0 + SLOT_ZONE_SPLIT) / 2;
export const slotEntry = (slot: number): [number, number] => [SLOT_ENTRY_X, slotCentre(slot)[1]];
export const SLOT_HEADING = Math.PI;

export const PLAN_SEED = 7;
export const PLAN_EPISODES = 400;
export const COLOURS = 6;

export interface CarRecord {
  numero: number;
  parcheggio: number;
  colore: number;
}

export type Kind = "ingresso" | "uscita";

export interface Episode {
  tipo: Kind;
  auto: CarRecord;
  prima: (CarRecord | null)[];
}

export const slotCentre = (slot: number): [number, number] => [SLOT_CAR_X, SLOT_Y0 + SLOT_WIDTH * (slot - 1) + SLOT_WIDTH / 2];

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function planEpisodes(count = PLAN_EPISODES, seed = PLAN_SEED): { episodes: Episode[]; cars: CarRecord[] } {
  const next = random(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(next() * list.length)];
  const slots: (CarRecord | null)[] = Array.from({ length: SLOT_COUNT }, () => null);
  const episodes: Episode[] = [];
  const cars: CarRecord[] = [];
  for (let index = 0; index < count; index++) {
    const taken = slots.filter(Boolean).length;
    const tipo: Kind = taken === 0 ? "ingresso" : taken === SLOT_COUNT ? "uscita" : next() < 0.5 ? "ingresso" : "uscita";
    const prima = [...slots];
    if (tipo === "ingresso") {
      const free = slots.map((car, slot) => (car ? -1 : slot + 1)).filter((slot) => slot > 0);
      const numero = cars.length + 1;
      const auto = { numero, parcheggio: pick(free), colore: (numero - 1) % COLOURS };
      cars.push(auto);
      slots[auto.parcheggio - 1] = auto;
      episodes.push({ tipo, auto, prima });
    } else {
      const auto = pick(slots.filter((car): car is CarRecord => car !== null));
      slots[auto.parcheggio - 1] = null;
      episodes.push({ tipo, auto, prima });
    }
  }
  return { episodes, cars };
}

const PLANNED = planEpisodes();

export const EPISODES = PLANNED.episodes;
export const CARS = PLANNED.cars;

export const parcheggioDi = (numero: number) => CARS.find((car) => car.numero === numero)?.parcheggio ?? null;
