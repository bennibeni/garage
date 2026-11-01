"use client";

import { useEffect, useRef, useState } from "react";
import type { MeshStandardMaterial } from "three";
import "./preview.css";
import { CAR_MODELS } from "../garage/car-models";

const COLOURS = [
  { label: "Rosso", value: "#c33f3d" },
  { label: "Blu", value: "#4782b0" },
  { label: "Verde", value: "#568c6b" },
  { label: "Bianco", value: "#e3e0d7" },
];

export function CarPreview() {
  const host = useRef<HTMLDivElement>(null);
  const paint = useRef<MeshStandardMaterial[]>([]);
  const redraw = useRef<() => void>(() => {});
  const turn = useRef<(delta: number) => void>(() => {});
  const [modelIndex, setModelIndex] = useState(0);
  const [status, setStatus] = useState("Caricamento modello…");
  const [ready, setReady] = useState(false);
  const [colour, setColour] = useState(COLOURS[0].value);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let dispose = () => {};
    async function setup() {
      const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
        import("three"),
        import("three/addons/loaders/GLTFLoader.js"),
        import("three/addons/controls/OrbitControls.js"),
      ]);
      if (cancelled) return;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#eeeee8");
      const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
      // Same 56° azimuth and 30° elevation as the SVG garage.
      camera.position.set(5.6, 5.8, 8.3);
      const target = new THREE.Vector3(0, 0.65, 0);
      camera.lookAt(target);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.setAttribute(
        "aria-label",
        "Automobile 3D Quaternius su piattaforma isometrica",
      );
      renderer.domElement.setAttribute("role", "img");
      element!.appendChild(renderer.domElement);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(target);
      controls.enablePan = false;
      controls.minZoom = 0.8;
      controls.maxZoom = 2;
      controls.minPolarAngle = Math.PI / 8;
      controls.maxPolarAngle = Math.PI / 2.15;
      controls.update();
      const render = () => renderer.render(scene, camera);
      redraw.current = render;
      turn.current = (delta) => {
        const offset = camera.position.clone().sub(target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta);
        camera.position.copy(target).add(offset);
        controls.update();
        render();
      };
      controls.addEventListener("change", render);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x777665, 2.4));
      const light = new THREE.DirectionalLight(0xfff5df, 3);
      light.position.set(-3, 8, 5);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.left = -5;
      light.shadow.camera.right = 5;
      light.shadow.camera.top = 5;
      light.shadow.camera.bottom = -5;
      light.shadow.normalBias = 0.02;
      scene.add(light);
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.12, 2.4),
        new THREE.MeshStandardMaterial({ color: "#c3cbd0", roughness: 0.8 }),
      );
      platform.position.y = -0.1;
      platform.receiveShadow = true;
      scene.add(platform);
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(4.7, 0.06, 0.08),
          new THREE.MeshStandardMaterial({
            color: "#737f89",
            metalness: 0.45,
            roughness: 0.45,
          }),
        );
        rail.position.set(0, -0.01, side * 0.95);
        rail.receiveShadow = true;
        scene.add(rail);
      }
      const resize = () => {
        const width = element!.clientWidth;
        const height = element!.clientHeight;
        const aspect = width / Math.max(height, 1);
        const halfHeight = Math.max(1.85, 3.1 / aspect);
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        render();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(element!);
      dispose = () => {
        observer.disconnect();
        controls.dispose();
        paint.current = [];
        redraw.current = () => {};
        turn.current = () => {};
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
      resize();
      const gltf = await new GLTFLoader().loadAsync(
        CAR_MODELS[modelIndex].path,
      );
      if (cancelled) {
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            (Array.isArray(object.material)
              ? object.material
              : [object.material]
            ).forEach((material) => material.dispose());
          }
        });
        return;
      }
      const car = gltf.scene;
      car.rotation.y = Math.PI / 2;
      const bounds = new THREE.Box3().setFromObject(car);
      const size = bounds.getSize(new THREE.Vector3());
      car.scale.setScalar(4.2 / size.x);
      bounds.setFromObject(car);
      const centre = bounds.getCenter(new THREE.Vector3());
      car.position.set(-centre.x, -bounds.min.y + 0.02, -centre.z);
      car.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          for (const material of materials) {
            if (
              material instanceof THREE.MeshStandardMaterial &&
              (material.name === "LightBlue" || material.name === "White")
            ) {
              material.color.set(COLOURS[0].value);
              material.roughness = 0.48;
              material.metalness = 0.12;
              if (!paint.current.includes(material))
                paint.current.push(material);
            }
          }
        }
      });
      scene.add(car);
      render();
      setReady(true);
      setStatus("Modello pronto · trascina per ruotare, scorri per lo zoom");
    }
    setup().catch(() => {
      if (!cancelled)
        setStatus("Anteprima 3D non disponibile in questo browser.");
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [modelIndex]);

  return (
    <section
      className="car-preview"
      aria-labelledby="car-preview-title"
      id="anteprima-auto"
    >
      <div className="car-preview-heading">
        <p className="car-preview-eyebrow">Prova del nuovo modello</p>
        <h2 id="car-preview-title">Una vera auto in 3D</h2>
        <p>Quaternius · vista isometrica come nel garage</p>
      </div>
      <label className="car-preview-model">
        Modello{" "}
        <select
          value={modelIndex}
          onChange={(event) => {
            setReady(false);
            setStatus("Caricamento modello…");
            setColour(COLOURS[0].value);
            setModelIndex(Number(event.target.value));
          }}
        >
          {CAR_MODELS.map((model, index) => (
            <option key={model.path} value={index}>
              {model.name}
            </option>
          ))}
        </select>
      </label>
      <div className="car-preview-canvas" ref={host} />
      <p className="car-preview-status" role="status">
        {status}
      </p>
      <div className="car-preview-controls">
        <button
          type="button"
          disabled={!ready}
          onClick={() => turn.current(-Math.PI / 4)}
          aria-label="Ruota auto a sinistra"
        >
          ←
        </button>
        {COLOURS.map((item) => (
          <button
            type="button"
            disabled={!ready}
            key={item.value}
            style={{ backgroundColor: item.value }}
            className="car-preview-colour"
            aria-label={`Colore ${item.label}`}
            aria-pressed={colour === item.value}
            onClick={() => {
              paint.current.forEach((material) =>
                material.color.set(item.value),
              );
              setColour(item.value);
              redraw.current();
            }}
          />
        ))}
        <button
          type="button"
          disabled={!ready}
          onClick={() => turn.current(Math.PI / 4)}
          aria-label="Ruota auto a destra"
        >
          →
        </button>
      </div>
      <p className="car-preview-source">
        <a href="https://poly.pizza/bundle/Cars-Bundle-FE5IWe6OMk">
          Modelli di Quaternius
        </a>{" "}
        · CC0 ·{" "}
        <a href={CAR_MODELS[modelIndex].path} download>
          Scarica GLB
        </a>
      </p>
    </section>
  );
}
