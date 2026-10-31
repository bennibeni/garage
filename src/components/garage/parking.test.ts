import { describe, expect, it } from "vitest";
import {
  CARS,
  EPISODES,
  SLOT_COUNT,
  parcheggioDi,
  planEpisodes,
} from "./parking";

describe("piano degli eventi", () => {
  it("con il tetto vuoto entra sempre una nuova auto", () => {
    for (const episode of EPISODES) {
      if (episode.prima.every((car) => car === null)) {
        expect(episode.tipo).toBe("ingresso");
      }
    }
  });

  it("con il tetto pieno esce sempre un'auto parcheggiata", () => {
    for (const episode of EPISODES) {
      if (episode.prima.every((car) => car !== null)) {
        expect(episode.tipo).toBe("uscita");
      }
    }
  });

  it("parcheggia solo in posti liberi e fa uscire solo auto presenti", () => {
    for (const { tipo, auto, prima } of EPISODES) {
      const slot = prima[auto.parcheggio - 1];
      if (tipo === "ingresso") expect(slot).toBeNull();
      else expect(slot?.numero).toBe(auto.numero);
    }
  });

  it("assegna a ogni auto un parcheggio valido", () => {
    for (const car of CARS) {
      expect(car.parcheggio).toBeGreaterThanOrEqual(1);
      expect(car.parcheggio).toBeLessThanOrEqual(SLOT_COUNT);
      expect(parcheggioDi(car.numero)).toBe(car.parcheggio);
    }
  });

  it("è riproducibile a parità di seme", () => {
    expect(planEpisodes(50, 3)).toEqual(planEpisodes(50, 3));
  });
});
