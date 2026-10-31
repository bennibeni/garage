# Garage automatico

App React con Next.js App Router, estratta dalla simulazione R11 di Next14.
Un garage automatico in pianta isometrica: l'auto entra dalla porta principale,
due piattaforme girevoli la ruotano di 90° a destra, un ascensore nascosto la
porta sul tetto e una terza piattaforma la parcheggia in un posto libero.
Gli eventi successivi alternano ingressi e uscite secondo lo stato del tetto.

## Avvio

Richiede Node.js 22.12 o successivo e npm. Non richiede chiavi API o file `.env`.

```powershell
cd "C:\Users\torre\Desktop\I miei progetti\garage"
npm ci
npm run dev
```

Apri l'indirizzo indicato nel terminale (normalmente `http://localhost:3000`).
Per usare un'altra porta: `npm run dev -- --port 3111`.

## Comandi

| Comando                | Azione                                          |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Server di sviluppo                              |
| `npm run build`        | Build di produzione                             |
| `npm start`            | Avvia la build di produzione                    |
| `npm test`             | Test delle regole di parcheggio e del moto      |
| `npm run test:watch`   | Test durante lo sviluppo                        |
| `npm run lint`         | Controlla TypeScript e React                    |
| `npm run lint:a11y`    | Include le regole di accessibilità              |
| `npm run typecheck`    | Verifica dei tipi TypeScript                    |
| `npm run format`       | Applica Prettier                                |
| `npm run format:check` | Verifica la formattazione                       |
| `npm run check`        | Formattazione, accessibilità, tipi, test, build |

## Comandi nella pagina

- **Clic** sulla figura o **Spazio**: pausa / riprendi.
- **←** / **→**: velocità ×0,5, ×1, ×2, ×4 (oltre al 4× di base).
- Con «riduci movimento» attivo nel sistema l'animazione parte solo al clic.

## Struttura

- `src/app/`: pagina, layout, metadati, icona e stili globali con il footer.
- `src/components/garage/`: simulazione copiata da R11 — piano degli eventi
  (`parking.ts`), moto e stati (`model.ts`), geometria e disegno statico
  (`geometry.ts`, `art.tsx`), fotogrammi (`frame.ts`, `live.tsx`), figura con
  titolo, sottotitolo e legenda (`figure.tsx`, `garage.css`).
- `src/components/iso/`: kit di proiezione isometrica e componenti React.
- `docs/MODELLO.md`: regole degli eventi e fasi del moto.
- `.prettierrc.json`, `.editorconfig`, `.vscode/`: formattazione coerente.
- `.gitignore`, `.gitattributes`: esclusioni e terminazioni di riga per Git.

Il footer **All projects** rimanda all'[indice degli altri progetti](https://links-page-bennibeni.vercel.app/),
come negli altri progetti recenti. Il progetto è pronto per un deploy Next.js,
ad esempio su Vercel; non è stato pubblicato automaticamente.
