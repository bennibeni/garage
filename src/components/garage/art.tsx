import { Dots, FaceText, Line, Solid } from "../iso/react/draw";
import { BOLLARD_ART, FLOOR_ART, MOTOR_ART, RAIL_ART, ROOF_ART, SIGN_ART, STALL_ART, TABLE_ART, WALL_ART } from "./geometry";
import { GarageLive } from "./live";

const FLOOR = (
  <g key="floor" className="gr-c-floor">
    <path className="iso-halo" d={FLOOR_ART.halo} />
    <Solid paths={FLOOR_ART.slab} tone="lo" crease="faint" inner={<Line d={FLOOR_ART.seam} tone="faint" />} />
    <Line d={FLOOR_ART.joints} tone="faint" />
    <Line d={FLOOR_ART.screwRings} tone="faint" />
    <Dots points={FLOOR_ART.screws} size={0.5} tone="mid" />
  </g>
);

const TUNNELS = (
  <g key="tunnels" className="gr-recess">
    {FLOOR_ART.tunnelFloors.map((paths, index) => (
      <Solid key={`f${index}`} paths={paths} tone="lo" crease="none" flat />
    ))}
    {FLOOR_ART.tunnelBacks.map((paths, index) => (
      <Solid key={`b${index}`} paths={paths} tone="lo" crease="none" />
    ))}
  </g>
);

const pier = (index: number) => (
  <g key={`pier${index}`}>
    <Solid paths={WALL_ART.piers[index]} tone="mid" crease="faint" />
    <Line d={WALL_ART.rules[index]} tone="faint" />
  </g>
);

const lintel = (index: number) => <Solid key={`lintel${index}`} paths={WALL_ART.lintels[index]} tone="mid" crease="faint" />;

const BUILDING = (
  <g key="building" className="gr-c-building">
    {pier(0)}
    {lintel(0)}
    {pier(1)}
    {lintel(1)}
    {pier(2)}
    {WALL_ART.plinth.map((paths, index) => (
      <Solid key={`k${index}`} paths={paths} tone="mid" crease="faint" />
    ))}
    {WALL_ART.frames.map((paths, index) => (
      <Solid key={`d${index}`} paths={paths} tone="mid" crease="faint" />
    ))}
    <Solid paths={WALL_ART.coping} tone="mid" crease="faint" />
    <g className="gr-recess">
      <Solid paths={SIGN_ART.panel} tone="lo" crease="faint" />
      <Dots points={SIGN_ART.screws} size={0.4} tone="mid" />
    </g>
    <Line d={WALL_ART.roofRules} tone="faint" />
  </g>
);

const ROOF = (
  <g key="roof">
    <g className="gr-c-building">
      <Line d={ROOF_ART.rim} tone="mid" />
    </g>
    <g className="gr-recess">
      <Solid paths={ROOF_ART.shaft} tone="lo" crease="none" flat />
    </g>
  </g>
);

const STALLS = (
  <g key="stalls" className="gr-c-building">
    <path className="gr-zone-transit" d={STALL_ART.transit} />
    <path className="gr-zone-parking" d={STALL_ART.parking} />
    <Line d={STALL_ART.divider} className="gr-zone-divider" tone="mid" />
    <Line d={STALL_ART.lines} tone="lo" className="gr-paint" />
    <Solid paths={STALL_ART.curb} tone="mid" crease="faint" />
    <g className="gr-c-rail">
      {STALL_ART.rails.map((paths, index) => <Solid key={`rail${index}`} paths={paths} tone="mid" crease="none" />)}
    </g>
    {STALL_ART.numbers.map((item) => (
      <FaceText key={item.label} transform={item.transform} size={9} tone="hi" anchor="middle">
        {item.label}
      </FaceText>
    ))}
  </g>
);

// Low door plinths stay behind passing cars; only the walls and lintels mask them.
const FRONT_FILLS = [...WALL_ART.frames, WALL_ART.coping].map((paths) => paths.fill);
const MASK_A = [WALL_ART.piers[1], WALL_ART.piers[2], WALL_ART.lintels[0], WALL_ART.lintels[1]].map((paths) => paths.fill).concat(FRONT_FILLS);
const MASK_B = [WALL_ART.piers[2], WALL_ART.lintels[1]].map((paths) => paths.fill).concat(FRONT_FILLS);

function table(art: typeof TABLE_ART.near, key: string) {
  return (
    <g key={key}>
      <g className="gr-c-pit">
        <Solid paths={art.pit} tone="lo" crease="none" flat />
        <Line d={art.pitRing} tone="faint" />
      </g>
      <g className="gr-c-deck">
        <Solid paths={art.deck} tone="mid" crease="faint" />
        <Line d={art.groove} tone="faint" />
      </g>
    </g>
  );
}

const RAILS_B = (
  <g key="rails-b" className="gr-c-rail">
    {RAIL_ART.far.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" crease="faint" />
    ))}
    <Dots points={RAIL_ART.boltsFar} size={0.4} tone="mid" />
    <Line d={RAIL_ART.arrowsOut} tone="lo" className="gr-paint" />
  </g>
);

const RAILS_A = (
  <g key="rails-a" className="gr-c-rail">
    {RAIL_ART.near.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" crease="faint" />
    ))}
    <Dots points={RAIL_ART.boltsNear} size={0.4} tone="mid" />
    <Line d={RAIL_ART.arrowsIn} tone="lo" className="gr-paint" />
  </g>
);

const TABLES = (
  <g key="tables">
    {table(TABLE_ART.near, "near")}
    {table(TABLE_ART.far, "far")}
    <g className="gr-c-rail">
      {RAIL_ART.cross.map((paths, index) => (
        <Solid key={`cross${index}`} paths={paths} tone="mid" crease="faint" />
      ))}
    </g>
  </g>
);

function hub(art: typeof TABLE_ART.near, key: string) {
  return (
    <g key={key}>
      <Solid paths={art.hub} tone="mid" crease="faint" />
      <Dots points={art.hubDot} size={0.5} tone="mid" />
    </g>
  );
}

const HUBS = (
  <g key="hubs" className="gr-c-rail">
    {hub(TABLE_ART.near, "near")}
    {hub(TABLE_ART.far, "far")}
  </g>
);

function motor(art: typeof MOTOR_ART.near, key: string) {
  return (
    <g key={key}>
      <g className="gr-c-rail">
        <Solid paths={art.pinion} tone="mid" crease="faint" />
        <Line d={art.pinionTeeth} tone="lo" />
        <Solid paths={art.shaft} tone="mid" crease="none" />
      </g>
      <path className="iso-halo" d={art.halo} />
      <g className="gr-c-yellow">
        <Solid paths={art.body} tone="mid" crease="faint" inner={<Line d={art.seam} tone="faint" />} />
        <Line d={art.fins} tone="lo" />
        <Dots points={art.screws} size={0.45} tone="mid" />
      </g>
      <g className="gr-c-tire">
        <Solid paths={art.gland} tone="mid" crease="none" />
      </g>
    </g>
  );
}

const MOTORS = (
  <g key="motors">
    {motor(MOTOR_ART.near, "near")}
    {motor(MOTOR_ART.far, "far")}
  </g>
);

const BOLLARDS = BOLLARD_ART.map((art, index) => ({
  y: art.y,
  element: (
    <g key={`bollard${index}`} className="gr-c-yellow">
      <Solid paths={art.body} tone="mid" crease="faint" inner={<Line d={art.bands} tone="hi" className="gr-band" />} />
    </g>
  ),
}));

export function GarageArt() {
  return (
    <GarageLive
      label="Un garage automatico in pianta isometrica. Un'auto esce da una porta, percorre un doppio binario, una piattaforma girevole la ruota di 90 gradi a destra, l'auto passa su una seconda piattaforma che la ruota ancora di 90 gradi a destra, poi percorre il binario parallelo ed entra nella seconda porta."
      floor={FLOOR}
      tunnels={TUNNELS}
      building={BUILDING}
      roof={ROOF}
      stalls={STALLS}
      hatchClip={ROOF_ART.clip}
      maskA={MASK_A}
      maskB={MASK_B}
      railsA={RAILS_A}
      railsB={RAILS_B}
      tables={TABLES}
      hubs={HUBS}
      motors={MOTORS}
      bollards={BOLLARDS}
    />
  );
}
