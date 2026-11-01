import { describe, expect, it } from "vitest";
import {
  CYCLE,
  exchangeAt,
  PARKING_TIME,
  V_MAX,
  ACCEL,
  PLATFORM_LENGTH,
  PLATFORM_WIDTH,
  PLATFORM_DOCK,
  ROOF_R,
  ROOF_Z,
  LIFT,
  stagesOf,
  transferAt,
  REST_TIME,
  eventOf,
  readoutOf,
  stateAt,
  trapezoid,
  trapezoidTime,
} from "./model";
import {
  EPISODES,
  SLOT_COUNT,
  SLOT_HEADING,
  slotCentre,
  slotEntry,
  SLOT_ZONE_SPLIT,
  SLOT_X0,
  SLOT_X1,
} from "./parking";

describe("modello del moto", () => {
  it("il profilo trapezoidale copre tutta la distanza", () => {
    const distance = 200;
    const end = trapezoid(distance, trapezoidTime(distance));
    expect(end.at).toBeCloseTo(distance, 6);
  });

  it("numera gli eventi in ordine lungo il ciclo", () => {
    let last = 0;
    for (let time = 0; time < CYCLE; time += CYCLE / 4000) {
      const { evento } = stateAt(time);
      expect(evento).toBeGreaterThanOrEqual(last);
      last = evento;
    }
    expect(last).toBe(EPISODES.length);
  });

  it("descrive lo stato iniziale", () => {
    const rest = stateAt(REST_TIME);
    expect(eventOf(rest)).toBe("Evento 1 · ingresso");
    expect(readoutOf(rest)).toMatch(/^Auto 1 /);
  });
});

describe("trasferimento sul tetto", () => {
  it("collega ascensore e ciascuno dei cinque posti", () => {
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      expect(transferAt(slot, 0)).toEqual({
        car: LIFT,
        heading: SLOT_HEADING,
        carElevation: 0,
      });
      expect(transferAt(slot, 1)).toEqual({
        car: slotCentre(slot),
        heading: SLOT_HEADING,
        carElevation: 0,
      });
      for (const u of [0.32, 0.4, 0.48, 0.56, 0.64]) {
        expect(transferAt(slot, u).carElevation).toBe(0);
        expect(transferAt(slot, u).heading).toBe(SLOT_HEADING);
      }
    }
  });

  it("mantiene una sola auto attiva e posizioni continue ai confini", () => {
    let start = 0;
    for (const episode of EPISODES) {
      for (const step of stagesOf(episode)) {
        if (step.stage === "parking" || step.stage === "deparking") {
          const before = stateAt(start - 0.000001);
          const first = stateAt(start + 0.000001);
          const last = stateAt(start + step.time - 0.000001);
          const after = stateAt(start + step.time + 0.000001);
          expect(first.slots[episode.auto.parcheggio - 1]).toBeNull();
          expect(last.slots[episode.auto.parcheggio - 1]).toBeNull();
          expect(first.shown).toBe(1);
          expect(last.shown).toBe(1);
          const slot = slotCentre(episode.auto.parcheggio);
          const source = step.stage === "parking" ? before.car : slot;
          const target = step.stage === "parking" ? slot : after.car;
          for (let axis = 0; axis < 2; axis++) {
            expect(first.car[axis]).toBeCloseTo(source[axis], 5);
            expect(last.car[axis]).toBeCloseTo(target[axis], 5);
          }
          expect(first.lift).toBe(ROOF_Z);
          expect(last.carElevation).toBeCloseTo(0, 5);
          if (step.stage === "parking")
            expect(after.slots[episode.auto.parcheggio - 1]).toEqual(
              episode.auto,
            );
        }
        start += step.time;
      }
    }
  });
});

describe("braccio robotico", () => {
  it("mantiene il supporto sotto l'auto e rientra senza salti", () => {
    let start = 0;
    for (const episode of EPISODES) {
      for (const step of stagesOf(episode)) {
        const mid = stateAt(start + step.time / 2);
        if (step.stage === "parking" || step.stage === "deparking") {
          expect(mid.arm.car).toEqual(mid.car);
          expect(mid.arm.heading).toBe(mid.heading);
          expect(mid.arm.carElevation).toBe(mid.carElevation);
        }
        const before = stateAt(start + step.time - 0.000001).arm;
        const after = stateAt(start + step.time + 0.000001).arm;
        for (let axis = 0; axis < 2; axis++)
          expect(before.car[axis]).toBeCloseTo(after.car[axis], 4);
        expect(before.heading).toBeCloseTo(after.heading, 4);
        expect(before.carElevation).toBeCloseTo(after.carElevation, 4);
        start += step.time;
      }
    }
  });
});

it("scorre autonomamente dalla piattaforma ai binari", () => {
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    const entry = slotEntry(slot);
    const end = slotCentre(slot);
    expect(transferAt(slot, 0.8).car).toEqual(entry);
    expect(transferAt(slot, 0.84).car).toEqual(entry);
    let previous = entry[0];
    for (let frame = 84; frame <= 100; frame++) {
      const state = transferAt(slot, frame / 100);
      expect(state.carElevation).toBe(0);
      expect(state.heading).toBe(SLOT_HEADING);
      expect(state.car[1]).toBe(entry[1]);
      expect(state.car[0]).toBeGreaterThanOrEqual(previous);
      expect(state.car[0]).toBeLessThanOrEqual(end[0]);
      previous = state.car[0];
    }
  }
});

it("separa parcheggio numerato e transito e tiene il braccio lontano dalle auto in sosta", () => {
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    expect(slotCentre(slot)[0] - 42).toBeGreaterThan(SLOT_ZONE_SPLIT);
    expect(slotCentre(slot)[0] + 42).toBeLessThan(SLOT_X1);
    expect(slotEntry(slot)[0] - 42).toBeGreaterThan(SLOT_X0);
    expect(slotEntry(slot)[0] + 42).toBeLessThan(SLOT_ZONE_SPLIT);
    for (let tick = 0; tick <= 80; tick++) {
      const state = transferAt(slot, tick / 100);
      if (state.car[1] < 44)
        expect(state.car[0] + 42).toBeLessThan(SLOT_ZONE_SPLIT);
    }
  }
});

it("mantiene l'orientamento sul tetto per ingressi e uscite", () => {
  let start = 0;
  for (const episode of EPISODES) {
    for (const step of stagesOf(episode)) {
      for (const fraction of [0.001, 0.25, 0.5, 0.75, 0.999]) {
        const state = stateAt(start + step.time * fraction);
        if (
          [
            "lift",
            "prep",
            "armReady",
            "parking",
            "deparking",
            "armReturn",
            "reset",
            "lower",
          ].includes(state.stage)
        ) {
          expect(state.heading).toBe(SLOT_HEADING);
          expect(state.arm.heading).toBe(SLOT_HEADING);
          expect(state.table3).toBe(0);
        }
      }
      start += step.time;
    }
  }
});

it("trasferisce tutte le auto alla quota dei binari senza sollevarle", () => {
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    for (let frame = 0; frame <= 200; frame++) {
      expect(transferAt(slot, frame / 200).carElevation).toBe(0);
    }
  }
});

it("mantiene a livello del tetto anche il carrello a vuoto", () => {
  let start = 0;
  for (const episode of EPISODES) {
    for (const step of stagesOf(episode)) {
      for (const fraction of [0.001, 0.2, 0.5, 0.8, 0.999]) {
        expect(stateAt(start + step.time * fraction).arm.carElevation).toBe(0);
      }
      start += step.time;
    }
  }
});

it("tiene la piattaforma fuori dal vano ascensore anche durante lo scambio", () => {
  expect(PLATFORM_LENGTH).toBeLessThan(84);
  expect(PLATFORM_LENGTH / 2).toBeGreaterThan(27 + 6.5);
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    for (let frame = 0; frame <= 100; frame++) {
      const progress = Math.min(Math.max(frame / 100, 0.2), 0.8);
      const platform = transferAt(slot, progress).car;
      const dx = Math.max(
        Math.abs(platform[0] - LIFT[0]) - PLATFORM_LENGTH / 2,
        0,
      );
      const dy = Math.max(
        Math.abs(platform[1] - LIFT[1]) - PLATFORM_WIDTH / 2,
        0,
      );
      expect(Math.hypot(dx, dy)).toBeGreaterThan(ROOF_R + 2.4);
    }
    expect(transferAt(slot, 0.2).car).toEqual(PLATFORM_DOCK);
  }
});

it("apre i raccordi solo a piattaforma ferma e blocca le ruote durante il trasporto", () => {
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    for (let frame = 1; frame < 1000; frame++) {
      const u = frame / 1000;
      const exchange = exchangeAt(u);
      const before = transferAt(
        slot,
        Math.min(Math.max(u - 0.0001, 0.2), 0.8),
      ).car;
      const after = transferAt(
        slot,
        Math.min(Math.max(u + 0.0001, 0.2), 0.8),
      ).car;
      const moving =
        Math.hypot(after[0] - before[0], after[1] - before[1]) > 0.00001;
      if (moving) {
        expect(exchange.liftBridge).toBe(0);
        expect(exchange.parkingBridge).toBe(0);
        expect(exchange.latch).toBe(1);
        expect(exchange.brake).toBe(false);
      }
      if (u > 0.06 && u < 0.2) expect(exchange.liftBridge).toBe(1);
      if (u > 0.84 && u < 0.96) expect(exchange.parkingBridge).toBe(1);
    }
  }
});

it("rispetta velocità e accelerazione durante gli scambi orizzontali", () => {
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    const dt = PARKING_TIME / 2000;
    let last = transferAt(slot, 0).car;
    let velocity = [0, 0];
    for (let tick = 1; tick <= 2000; tick++) {
      const point = transferAt(slot, tick / 2000).car;
      const next = point.map((value, axis) => (value - last[axis]) / dt);
      expect(Math.hypot(...next)).toBeLessThanOrEqual(V_MAX);
      expect(
        Math.hypot(...next.map((value, axis) => (value - velocity[axis]) / dt)),
      ).toBeLessThanOrEqual(ACCEL);
      velocity = next;
      last = point;
    }
  }
});
