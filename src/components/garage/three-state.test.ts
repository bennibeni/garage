import { expect, it } from "vitest";
import { stagesOf, stateAt } from "./model";
import { EPISODES } from "./parking";
import { activeCarVisible } from "./three-state";

it("mantiene l'auto GLB visibile in salita, discesa e inversione anche quando lo SVG la nasconde", () => {
  let time = 0;
  const checked = new Set<string>();
  for (const episode of EPISODES.slice(0, 10)) {
    for (const stage of stagesOf(episode)) {
      for (const fraction of [0.01, 0.1, 0.5, 0.9, 0.99]) {
        const state = stateAt(time + stage.time * fraction);
        if (["lift", "lower", "swap"].includes(stage.stage)) {
          expect(activeCarVisible(state)).toBe(true);
          if (state.shown === 0) checked.add(stage.stage);
        }
        if (["prep", "reset"].includes(stage.stage))
          expect(activeCarVisible(state)).toBe(false);
        if (state.slots.some((car) => car?.numero === state.numero))
          expect(activeCarVisible(state)).toBe(false);
      }
      time += stage.time;
    }
  }
  expect([...checked].sort()).toEqual(["lift", "lower", "swap"]);
});
