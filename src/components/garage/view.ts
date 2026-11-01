import { boxCorners, cameraOf, fitProjection, type Plan } from "../iso/iso-kit";
import { LIFT, ROOF_R, ROOF_Z, T1, TABLE_R, WALL_X } from "./model";

import { SLOT_X0 } from "./parking";

export const WIDTH = 640;
export const HEIGHT = 400;
export const AZIMUTH = 56;

export const FLOOR: Plan = { x: SLOT_X0 - 4, y: -190, w: 140 - (SLOT_X0 - 4), d: 392, r: 8 };
export const FLOOR_Z = -10;
export const WALL_H = 70;
export const WALL_Y0 = -190;
export const WALL_Y1 = 202;
export const DOOR_H = 46;
export const DOOR_HALF = 28;
export const RECESS_X = -218;

export const RAIL_W = 5;
export const RAIL_H = 1.2;
export const RAIL_START = RECESS_X;
export const RAIL_END = T1[0] - TABLE_R - 0.6;

export const PIT_R = TABLE_R + 2.6;
export const DECK_Z = 0.4;

export const MOTOR: Plan = { x: T1[0] + TABLE_R + 6, y: -9, w: 16, d: 18, r: 2 };
export const MOTOR_H = 12;
export const PINION_R = 3.2;

export const CAR_Z = RAIL_H;

export const P = fitProjection(
  [...boxCorners(FLOOR, FLOOR_Z, 0), ...boxCorners({ x: FLOOR.x, y: WALL_Y0, w: WALL_X - FLOOR.x, d: WALL_Y1 - WALL_Y0, r: 0 }, 0, WALL_H), ...boxCorners({ x: FLOOR.x, y: -190, w: WALL_X - FLOOR.x, d: LIFT[1] + ROOF_R + 190, r: 0 }, ROOF_Z, ROOF_Z + 30)],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: AZIMUTH },
);
export const K = cameraOf(P).k;
