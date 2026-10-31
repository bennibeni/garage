import { describe, expect, it } from "vitest";
import {
  CYCLE,
  REST_TIME,
  eventOf,
  readoutOf,
  stateAt,
  trapezoid,
  trapezoidTime,
} from "./model";
import { EPISODES } from "./parking";

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
