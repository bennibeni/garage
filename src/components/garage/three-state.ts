import type { State } from "./model";

// SVG fades cars behind the building. In 3D the geometry handles occlusion;
// hide the active clone only on empty lift journeys or while it is parked.
export function activeCarVisible(state: State) {
  return state.stage !== "prep" && state.stage !== "reset"
    && !state.slots.some(car => car?.numero === state.numero);
}
