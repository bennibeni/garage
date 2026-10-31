# Garage automatico

App autonoma React/Next.js estratta da `Next14/src/app/rxx/R11`.
Usa TypeScript, CSS semplice e il kit isometrico `anatomy` copiato in
`src/components/iso/`.

- La simulazione è in `src/components/garage/`; il kit di disegno isometrico in
  `src/components/iso/`. Non introdurre dipendenze dal progetto Next14.
- Lo stato dell'animazione è una funzione pura del tempo: `stateAt(t)` in
  `model.ts`, sul piano di 400 eventi generato con seme fisso in `parking.ts`.
  Non introdurre stato React per i fotogrammi: `live.tsx` scrive gli attributi
  SVG direttamente a ogni frame.
- Regole degli eventi: tetto vuoto → ingresso; tetto pieno → uscita; altrimenti
  scelta casuale. Display verde «LIBERI n», rosso «COMPLETO».
- Riproduzione 4× il tempo reale; clic o Spazio per pausa, frecce per velocità.
  Nessuna pausa automatica.
- Conservare il footer con link `https://links-page-bennibeni.vercel.app/`.
- Leggere i documenti pertinenti in `node_modules/next/dist/docs/` prima di
  modificare routing, layout o configurazione Next.js.
- Eseguire `npm run check` dopo modifiche sostanziali. Prettier gestisce lo
  stile dei file nuovi; i file del kit e della simulazione conservano la
  formattazione originale (vedi `.prettierignore`).
