import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CAR_MODELS, modelForCar } from "./car-models";
import { activeCarVisible } from "./three-state";
import { CAR_L, CAR_W, LIFT, PLATFORM_LENGTH, PLATFORM_WIDTH, ROOF_R, ROOF_Z, T1, T2, TABLE_R, TRACK, WALL_X, type State } from "./model";
import { SLOT_X0, SLOT_COUNT, SLOT_WIDTH, SLOT_Y0, SLOT_ZONE_SPLIT, SLOT_X1, SLOT_ENTRY_X, slotCentre } from "./parking";
import { AZIMUTH, CAR_Z, DECK_Z, FLOOR, HEIGHT, K, P, RAIL_END, RAIL_H, RAIL_W, WIDTH } from "./view";

const PAINT = ["#d8343a", "#2f6fd6", "#2e9e5b", "#f08a24", "#7d4ad1", "#e8e6e1"];

/** World (x, y, height) maps to Three (x, height, y). */
export function createGarageScene(host: HTMLDivElement) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(0, WIDTH / K, 0, -HEIGHT / K, 0.1, 4000);
  const a = THREE.MathUtils.degToRad(AZIMUTH);
  const e = Math.PI / 6;
  camera.position.set(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).multiplyScalar(1500);
  camera.lookAt(0, 0, 0);
  camera.left = -P.origin[0] / K;
  camera.right = (WIDTH - P.origin[0]) / K;
  camera.top = P.origin[1] / K;
  camera.bottom = (P.origin[1] - HEIGHT) / K;
  camera.updateProjectionMatrix();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x78818a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff3df, 2.3);
  sun.position.set(100, 400, 200);
  scene.add(sun);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (colour: string) => {
    if (!materials.has(colour)) materials.set(colour, new THREE.MeshStandardMaterial({ color: colour, roughness: 0.7, metalness: 0.12 }));
    return materials.get(colour)!;
  };
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, d: number, h: number, colour: string) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(colour));
    mesh.position.set(x, z + h / 2, y);
    parent.add(mesh);
    return mesh;
  }
  const textures: THREE.Texture[] = [];
  function cylinder(parent: THREE.Object3D, x: number, y: number, z: number, radius: number, height: number, colour: string) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), material(colour));
    mesh.position.set(x, z + height / 2, y); parent.add(mesh); return mesh;
  }
  function ring(parent: THREE.Object3D, x: number, y: number, z: number, radius: number, width: number, colour: string) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 96), material(colour));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, z, y); parent.add(mesh); return mesh;
  }
  function label(text: string, x: number, y: number, z: number, width: number, height: number, colour = "#284656") {
    const canvas = document.createElement("canvas"); canvas.width = text.length === 1 ? 128 : 512; canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = colour; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 80px monospace";
    ctx.fillText(text, canvas.width / 2, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, z, y); scene.add(mesh);
    return mesh;
  }
  function arrow(x: number, y: number, direction: number) {
    const shape = new THREE.Shape();
    const points = [[-9,-3],[0,-3],[0,-7],[9,0],[0,7],[0,3],[-9,3]];
    points.forEach(([u,v],i) => i ? shape.lineTo(u,v) : shape.moveTo(u,v)); shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material("#f3bd36"));
    mesh.rotation.set(-Math.PI / 2, 0, direction === 1 ? 0 : Math.PI); mesh.position.set(x, 0.15, y); scene.add(mesh);
  }
  function rails(parent: THREE.Object3D, length: number, z = DECK_Z) {
    for (const side of [-1, 1]) box(parent, 0, side * TRACK / 2, z, length, RAIL_W, RAIL_H, "#7e8993");
  }
  function deck(x: number, y: number, radius: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 4, 64), material("#b9c4cb"));
    disc.position.y = DECK_Z - 2;
    group.add(disc);
    ring(group, 0, 0, DECK_Z + 0.04, radius - 7, 0.7, "#617584");
    ring(group, 0, 0, DECK_Z + 0.05, radius - 1, 1.4, "#dfac32");
    cylinder(group, 0, 0, DECK_Z, 6, 1.2, "#536b7b");
    for (let i = 0; i < 32; i++) {
      const angle = i * Math.PI / 16;
      const tooth = box(group, Math.cos(angle) * (radius - 0.8), Math.sin(angle) * (radius - 0.8), DECK_Z - 2.8, 2.8, 1.4, 1.4, "#657988");
      tooth.rotation.y = -angle;
      if (i % 4 === 0) cylinder(group, Math.cos(angle) * (radius - 11), Math.sin(angle) * (radius - 11), DECK_Z + 0.06, 0.8, 0.3, "#445660");
    }
    rails(group, radius * 2 - 2);
    scene.add(group);
    return group;
  }
  box(scene, FLOOR.x + FLOOR.w / 2, FLOOR.y + FLOOR.d / 2, -10, FLOOR.w, FLOOR.d, 10, "#cbd0cb");
  // Front piers and lintels leave two real openings, so depth testing hides the cars.
  for (const [lo, hi] of [[-190, -28], [28, 92], [148, 202]]) {
    box(scene, WALL_X - 5, (lo + hi) / 2, 0, 10, hi - lo, 70, "#dbb280");
  }
  for (const y of [T1[1], T2[1]]) {
    const groundRailStart = y === LIFT[1] ? LIFT[0] + ROOF_R - 1 : WALL_X - 4;
    box(scene, WALL_X - 5, y, 46, 10, 56, 24, "#dbb280");
    for (const side of [-1, 1]) {
      box(scene, (groundRailStart + RAIL_END) / 2, y + side * TRACK / 2, DECK_Z, RAIL_END - groundRailStart, RAIL_W, RAIL_H, "#657d8d");
      for (let x = WALL_X + 7; x < RAIL_END - 3; x += 14) cylinder(scene, x, y + side * TRACK / 2, DECK_Z + RAIL_H, 0.65, 0.3, "#354d5b");
      const by = y + side * 36;
      cylinder(scene, WALL_X + 10, by, 0, 4, 1.5, "#4e5a60");
      cylinder(scene, WALL_X + 10, by, 1.5, 3, 19, "#edb52d");
      for (const z of [13, 17]) cylinder(scene, WALL_X + 10, by, z, 3.08, 1.5, "#424b53");
    }
    for (const x of [-70, -40]) arrow(x, y, y === T1[1] ? 1 : -1);
    for (const side of [-1, 1]) box(scene, WALL_X + 1.1, y + side * 29.5, 0, 2.2, 3, 49, "#986f42");
    box(scene, WALL_X + 1.1, y, 46, 2.2, 62, 3, "#986f42");
  }
  const glass = new THREE.MeshStandardMaterial({ color: "#74a8b8", transparent: true, opacity: 0.22, roughness: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const buildingWidth = WALL_X - FLOOR.x;
  for (const y of [-188, 200]) {
    const wall = box(scene, (FLOOR.x + WALL_X) / 2, y, 0, buildingWidth, 4, 70, "#dbb280");
    wall.material = glass;
    for (const z of [0, 24, 47, 69]) box(scene, (FLOOR.x + WALL_X) / 2, y, z, buildingWidth, 2, 1.2, "#b68b59");
    for (let x = FLOOR.x + 2; x < WALL_X; x += 51) box(scene, x, y, 0, 2, 3, 70, "#b68b59");
  }
  box(scene, FLOOR.x + 2, 6, 0, 4, 392, 70, "#c59d6d");
  for (const [lo, hi] of [[-190,-28],[28,92],[148,202]]) {
    box(scene, WALL_X + 0.8, (lo + hi) / 2, 0, 1.6, hi - lo, 5, "#a87d50");
    for (const z of [24,47]) box(scene, WALL_X + 0.1, (lo + hi) / 2, z, 0.4, hi - lo, 0.65, "#b38d60");
  }
  // Roof panels surround the lift opening instead of covering it.
  const x0 = FLOOR.x, x1 = WALL_X;
  const y0 = -190, y1 = 202;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(x0, -y0); roofShape.lineTo(x1, -y0); roofShape.lineTo(x1, -y1); roofShape.lineTo(x0, -y1); roofShape.closePath();
  const hatch = new THREE.Path(); hatch.absarc(LIFT[0], -LIFT[1], 49, 0, Math.PI * 2, false); roofShape.holes.push(hatch);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 3, bevelEnabled: false, curveSegments: 64 }), material("#e9d2a9"));
  roof.rotation.x = -Math.PI / 2; roof.position.y = ROOF_Z - 3; scene.add(roof);
  const slotNumbers: ReturnType<typeof label>[] = [];
  const slotY1 = SLOT_Y0 + SLOT_COUNT * SLOT_WIDTH;
  box(scene, (SLOT_X0 + SLOT_ZONE_SPLIT) / 2, (SLOT_Y0 + slotY1) / 2, ROOF_Z + 0.02, SLOT_ZONE_SPLIT - SLOT_X0, slotY1 - SLOT_Y0, 0.07, "#89bdd0");
  box(scene, (SLOT_ZONE_SPLIT + SLOT_X1) / 2, (SLOT_Y0 + slotY1) / 2, ROOF_Z + 0.02, SLOT_X1 - SLOT_ZONE_SPLIT, slotY1 - SLOT_Y0, 0.07, "#9ac493");
  for (let i = 0; i <= SLOT_COUNT; i++) {
    const y = SLOT_Y0 + i * SLOT_WIDTH;
    box(scene, (SLOT_X0 + SLOT_X1) / 2, y, ROOF_Z + 0.12, SLOT_X1 - SLOT_X0, 1.4, 0.12, "#fff6d5");
    if (i === SLOT_COUNT) continue;
    const [x, cy] = slotCentre(i + 1);
    const stall = new THREE.Group(); stall.position.set(x - 1, ROOF_Z, cy);
    rails(stall, SLOT_X1 - SLOT_ZONE_SPLIT - 4); scene.add(stall);
    const number = label(String(i + 1), SLOT_X1 + 7, cy, ROOF_Z + 0.2, 34, 30, "#ffffff");
    number.material.toneMapped = false;
    slotNumbers.push(number);
  }
  for (let y = SLOT_Y0; y < slotY1; y += 8) box(scene, SLOT_ZONE_SPLIT, y + 2, ROOF_Z + 0.15, 1.1, 4, 0.1, "#366d88");
  box(scene, SLOT_X1, (SLOT_Y0 + slotY1) / 2, ROOF_Z + 0.12, 1.2, slotY1 - SLOT_Y0, 0.12, "#fff6d5");
  box(scene, SLOT_X0 - 1.5, (SLOT_Y0 + slotY1) / 2, ROOF_Z, 3, slotY1 - SLOT_Y0, 1.6, "#b28c51");
  label("TRANSITO", SLOT_ENTRY_X, 60, ROOF_Z + 0.16, 120, 32, "#254f68");
  const tables = [deck(...T1, TABLE_R), deck(...T2, TABLE_R)];
  for (const side of [-1, 1]) box(scene, T1[0] + side * TRACK / 2, 60, 0, RAIL_W, 120 - 2 * TABLE_R, RAIL_H, "#7e8993");
  for (const [x, y] of [T1, T2]) {
    ring(scene, x, y, 0.06, TABLE_R + 3.5, 2.7, "#65717b");
    box(scene, x + TABLE_R + 14, y, 0, 16, 18, 12, "#dbaa32");
    for (const dx of [4,7,10,13]) box(scene, x + TABLE_R + 6 + dx, y, 12, 0.7, 17, 0.6, "#8c6b29");
    cylinder(scene, x + TABLE_R + 3.4, y, DECK_Z, 3.2, 3.4, "#526b7a");
  }
  ring(scene, ...LIFT, ROOF_Z + 0.15, 51.5, 2.2, "#6c7f8c");
  const lift = deck(...LIFT, ROOF_R);
  const platform = new THREE.Group();
  box(platform, 0, 0, DECK_Z - 1.6, PLATFORM_LENGTH, PLATFORM_WIDTH, 1.6, "#c9aa4b");
  rails(platform, PLATFORM_LENGTH);
  // At heading PI the trolley and coupling sit on the negative-X guide.
  box(platform, 44, 0, DECK_Z - 1.6, 14, 8, 1.6, "#b58b2c");
  box(platform, 48, 0, DECK_Z, 6, 14, 4, "#d9a62c");
  for (const side of [-1, 1]) cylinder(platform, 48, side * 5, DECK_Z, 2.4, 1.2, "#536979");
  scene.add(platform);
  box(scene, SLOT_ENTRY_X - 48, (-163 + LIFT[1]) / 2, ROOF_Z, 4, LIFT[1] + 163, 0.5, "#91989c");
  const guideX = SLOT_ENTRY_X - 48;
  box(scene, (guideX + LIFT[0] - 48) / 2, LIFT[1], ROOF_Z, LIFT[0] - 48 - guideX + 4, 4, 0.5, "#6b8291");
  for (let y = -163; y <= LIFT[1]; y += 14) box(scene, guideX, y, ROOF_Z - 0.1, 8, 3, 0.5, "#5d7685");
  const bridges = [-1, 1].map(() => box(scene, 0, 0, ROOF_Z + DECK_Z + RAIL_H - 0.5, 1, RAIL_W, 0.5, "#89949e"));
  const stops = [-1, 1].map(side => box(platform, -19.5, side * TRACK / 2, DECK_Z + RAIL_H, 2, 5, 3, "#b87337"));
  const brake = box(platform, -30, 0, DECK_Z + 1, 3, 3, 1, "#27834b");
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 512; signCanvas.height = 96;
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(78, 17), new THREE.MeshBasicMaterial({ map: signTexture, toneMapped: false }));
  sign.position.set(WALL_X + 3.1, 59, 60);
  sign.rotation.y = Math.PI / 2;
  box(scene, WALL_X + 1.5, 60, 49, 3, 84, 20, "#243d48");
  signTexture.colorSpace = THREE.SRGBColorSpace;

  scene.add(sign);
  let lastFree = -1;
  const cars: THREE.Group[] = [];
  let disposed = false;
  const geometries = new Set<THREE.BufferGeometry>();
  const ownedMaterials = new Set<THREE.Material>();
  function release(root: THREE.Object3D) {
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(item => ownedMaterials.add(item));
      }
    });
  }
  const ready = Promise.allSettled(CAR_MODELS.map(model => new GLTFLoader().loadAsync(model.path))).then(results => {
    const loaded = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
    if (disposed || loaded.length !== CAR_MODELS.length) {
      loaded.forEach(gltf => release(gltf.scene));
      geometries.forEach(item => item.dispose());
      ownedMaterials.forEach(item => item.dispose());
      if (!disposed) throw new Error("Caricamento modelli auto non riuscito");
      return;
    }
    const templates = loaded.map(gltf => {
      const source = new THREE.Group();
      gltf.scene.rotation.y = Math.PI / 2;
      source.add(gltf.scene);
      const bounds = new THREE.Box3().setFromObject(source);
      const size = bounds.getSize(new THREE.Vector3());
      source.scale.setScalar(Math.min(CAR_L / size.x, CAR_W / size.z));
      bounds.setFromObject(source);
      const centre = bounds.getCenter(new THREE.Vector3());
      const normalized = new THREE.Group();
      source.position.set(-centre.x, -bounds.min.y, -centre.z);
      normalized.add(source);
      release(normalized);
      return normalized;
    });
    for (let i = 0; i <= SLOT_COUNT; i++) {
      const car = new THREE.Group();
      templates.forEach(template => {
        const variant = template.clone(true);
        variant.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.material = Array.isArray(object.material) ? object.material.map(item => item.clone()) : object.material.clone();
          }
        });
        car.add(variant);
      });
      cars.push(car);
      scene.add(car);
    }
  });
  const colours = new WeakMap<THREE.Group, number>();
  function place(car: THREE.Group, x: number, y: number, z: number, heading: number, colour: number, number: number) {
    car.position.set(x, z, y);
    car.rotation.y = -heading;
    const selected = modelForCar(number);
    car.children.forEach((variant, index) => { variant.visible = index === selected; });
    if (colours.get(car) !== colour) {
      car.traverse(object => {
        if (object instanceof THREE.Mesh) {
          for (const item of Array.isArray(object.material) ? object.material : [object.material]) {
            if (item instanceof THREE.MeshStandardMaterial && (item.name === "LightBlue" || item.name === "White")) item.color.set(PAINT[colour % PAINT.length]);
          }
        }
      });
      colours.set(car, colour);
    }
  }
  function update(state: State) {
    tables[0].rotation.y = -state.table1;
    tables[1].rotation.y = -state.table2;
    lift.position.y = state.lift;
    lift.rotation.y = -state.table3;
    platform.position.set(state.arm.car[0], ROOF_Z, state.arm.car[1]);
    platform.rotation.y = -state.arm.heading;
    const bridge = state.exchange ? 9 * state.exchange.liftBridge + 11 * state.exchange.parkingBridge : 0;
    bridges.forEach((mesh, i) => {
      mesh.visible = bridge > 0.001;
      mesh.scale.x = Math.max(bridge, 0.001);
      mesh.position.x = state.arm.car[0] + PLATFORM_LENGTH / 2 - 1 + bridge / 2;
      mesh.position.z = state.arm.car[1] + (i ? 1 : -1) * TRACK / 2;
    });
    stops.forEach(mesh => { mesh.scale.y = Math.max(0.001, state.exchange?.latch ?? 0); });
    brake.material = material(state.exchange?.brake === false ? "#e6a120" : "#27834b");
    if (cars.length) {
      const active = cars[0];
      active.visible = activeCarVisible(state);
      place(active, ...state.car, CAR_Z + state.lift + state.carElevation + (state.roof ? DECK_Z : 0), state.heading, state.colore, state.numero);
      state.slots.forEach((record, i) => {
        cars[i + 1].visible = Boolean(record);
        if (record) {
          place(cars[i + 1], ...slotCentre(i + 1), ROOF_Z + DECK_Z + CAR_Z, Math.PI, record.colore, record.numero);
        }
      });
    }
    state.slots.forEach((record, index) => {
      slotNumbers[index].material.color.set(record ? "#c62732" : "#137a35");
    });
    const free = state.slots.filter(item => !item).length;
    if (free !== lastFree) {
      const ctx = signCanvas.getContext("2d")!;
      ctx.fillStyle = "#222c2b"; ctx.fillRect(0, 0, 512, 96);
      ctx.strokeStyle = "#dfb24a"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 506, 90);
      ctx.fillStyle = free ? "#85f49b" : "#ff6961";
      ctx.font = "bold 64px monospace"; ctx.textAlign = "center";
      ctx.fillText(free ? `LIBERI ${free}` : "COMPLETO", 256, 66);
      signTexture.needsUpdate = true;
      lastFree = free;
    }
    renderer.render(scene, camera);
  }
  const resize = () => {
    renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientWidth * HEIGHT / WIDTH));
    renderer.render(scene, camera);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return {
    ready, update,
    dispose() {
      disposed = true;
      observer.disconnect();
      release(scene);
      geometries.forEach(item => item.dispose());
      ownedMaterials.forEach(item => item.dispose());
      materials.forEach(item => item.dispose());
      signTexture.dispose();
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

