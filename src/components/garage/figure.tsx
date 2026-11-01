import { GarageArt } from "./art";
import { GarageThree } from "./three-live";
import { ACCEL, REST_TIME, ROOF_Z, TABLE_R, TURN_TIME, UNIT_M, V_MAX, eventOf, readoutOf, stateAt } from "./model";
import { SLOT_COUNT } from "./parking";
import "./garage.css";

const metres = (units: number) => (units * UNIT_M).toFixed(1).replace(".", ",");
const REST = stateAt(REST_TIME);

const KEYS = [
  { mark: "car", label: "Le auto, ognuna con il suo colore" },
  { mark: "deck", label: "Due piattaforme girevoli a terra; piattaforma elevatrice sul tetto" },
  { mark: "rail", label: "Doppio binario d'ingresso e d'uscita" },
  { mark: "paint", label: "Posti auto sul tetto, numerati" },
  { mark: "transit", label: "Zona di transito: carrello su guida con piattaforma di trasferimento" },
  { mark: "parking", label: "Zona di parcheggio vicino ai numeri: accesso autonomo sui binari" },
  { mark: "safety", label: "Piattaforma: verde = freno inserito, ambra = trasferimento" },
  { mark: "sign", label: "Display: posti liberi in verde, «completo» in rosso" },
];

export function GarageFigure() {
  return (
    <figure className="iso-figure gr-figure">
      <div className="iso-plate gr-plate">
        <header className="gr-head">
          <h1 className="gr-title">Garage automatico</h1>
          <p className="gr-sub">
            <kbd className="gr-key">Clic</kbd> pausa / riprendi
            <span className="gr-sep">·</span>
            <kbd className="gr-key">←</kbd>
            <kbd className="gr-key">→</kbd> velocità
          </p>
          <p className="gr-status">
            <span className="gr-event" data-event="">
              {eventOf(REST)}
            </span>
            <span className="gr-readout" data-readout="">
              {readoutOf(REST)}
            </span>
          </p>
        </header>
        <GarageThree fallback={<GarageArt />} />
      </div>
      <figcaption className="iso-legend">
        <span className="iso-keys">
          {KEYS.map((key) => (
            <span className="iso-key" key={key.mark}>
              <span className="gr-swatch" data-mark={key.mark} aria-hidden="true" />
              {key.label}
            </span>
          ))}
        </span>
        <span className="iso-caption">
          {`Ogni evento è un ingresso o un'uscita. Ingresso: una nuova auto (4,2 m) entra dalla porta principale, è ruotata due volte di 90° a destra dalle piattaforme a terra (Ø ${metres(TABLE_R * 2)} m, ${TURN_TIME} s per rotazione), sale sul tetto (${metres(ROOF_Z)} m) con l'ascensore nascosto e viene parcheggiata in un posto libero scelto a caso. Uscita: un'auto parcheggiata scelta a caso torna sulla piattaforma, scende e viene riaccompagnata alla porta principale. Con il tetto vuoto si ha sempre un ingresso, con il tetto pieno sempre un'uscita, altrimenti si sceglie a caso. Velocità massima ${(V_MAX * UNIT_M).toFixed(0)} m/s, accelerazione ${(ACCEL * UNIT_M).toFixed(0)} m/s², ${SLOT_COUNT} posti. L'animazione scorre 4 volte più veloce del tempo reale.`}
        </span>
      </figcaption>
    </figure>
  );
}
