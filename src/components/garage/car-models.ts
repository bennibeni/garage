export const CAR_MODELS = [
  { name: "Berlina", path: "/models/quaternius-car.glb" },
  { name: "Sportiva", path: "/models/quaternius-sport.glb" },
  { name: "SUV", path: "/models/quaternius-suv.glb" },
] as const;

export const modelForCar = (number: number) => (number - 1) % CAR_MODELS.length;
