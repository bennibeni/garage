# Garage automatico — modello

## Eventi

`parking.ts` genera all'avvio un piano di 400 eventi con un generatore
pseudocasuale a seme fisso (mulberry32, seme 7), quindi ogni visita mostra la
stessa sequenza. Prima di ogni evento si contano i posti occupati sul tetto
(5 posti):

1. nessun posto occupato → **ingresso**: una nuova auto entra e viene
   parcheggiata in un posto libero scelto a caso;
2. tutti i posti occupati → **uscita**: un'auto parcheggiata scelta a caso
   viene riportata alla porta principale;
3. negli altri casi ingresso o uscita con probabilità 1/2.

Ogni auto conserva il suo numero, il colore e il numero di parcheggio
(`parcheggioDi(numero)`).

## Fasi

Ingresso: binario d'ingresso → rotazione di 90° a destra sulla prima
piattaforma → attraversamento → rotazione sulla seconda → binario d'uscita →
ascensore nascosto → rotazione sulla piattaforma del tetto → parking.

Uscita: deparking sulla piattaforma del tetto → discesa → l'auto riappare
sullo stesso binario rivolta nel verso opposto → percorso inverso fino alla
porta principale.

I tratti rettilinei e l'ascensore seguono profili trapezoidali (velocità
massima 2 m/s, accelerazione 1 m/s²; ascensore 1 m/s e 0,5 m/s²). Ogni
rotazione dura 4 s. L'animazione scorre 4 volte più veloce del tempo reale.

`stateAt(t)` è una funzione pura del tempo nel ciclo: la pausa, la velocità e
la riproduzione cambiano solo l'orologio, non il modello.

## Trasferimento sul tetto

Parking e deparking durano 12 secondi simulati ciascuno. Durante il parking
l'auto si solleva di 36 unit� (1,8 m), si allinea con i posti sopra
l'ascensore, trasla fino al posto assegnato e scende. Durante la traslazione
rimane sopra il tetto delle altre auto. Il deparking percorre esattamente
la stessa traiettoria al contrario. Il braccio di supporto non � ancora disegnato.

La quota aggiuntiva `carElevation` riguarda solo l'auto: la piattaforma
rimane sul tetto. Il posto diventa occupato al deposito; al prelievo l'auto
passa dal disegno statico al disegno animato senza duplicazioni.

Prima di ogni trasferimento `armReady` avvicina il braccio a vuoto;
`armReturn` lo riporta sopra l'ascensore dopo il rilascio. Entrambe le fasi
durano 6 secondi simulati. L'auto resta sul supporto durante parking/deparking
e viene disegnata una sola volta. La posa del braccio � calcolata da
`stateAt(t)`, anche nelle fasi a vuoto; non usa stato React per i fotogrammi.

La presa avviene con forcelle retratte: il polso si allinea, scende e solo
poi estende le due traverse longitudinalmente sotto il telaio, all’interno della carreggiata.
Dopo il deposito l'auto resta ferma mentre le forcelle si ritirano;
il polso risale solo a ritiro completato. Le traverse toccano il fondo
del telaio e restano lontane dagli pneumatici. Sollevamento e appoggio usano
un profilo quintico con velocit� e accelerazione nulle alle estremit�.

## Posti allungati e binari

I cinque posti misurano 188 unità (9,4 m) anziché 94: il bordo anteriore
rimane a X = -128 e l'estensione occupa la nuova area fino a X = -316.
Il tetto e il basamento si estendono fino a X = -320. Le auto vengono
centrate sui posti allungati. Ogni posto ha due rotaie con interasse uguale
alla carreggiata delle auto e traversine lungo tutta la lunghezza.
La base del braccio si trova nella nuova area, a X = -296, Y = 120,
fuori dai posti e dal vano dell'ascensore.

## Area aggiuntiva e scorrimento

Il piano superiore termina a X = -320, senza una soletta dedicata al braccio.
La base del braccio è tornata a X = -296, Y = 120.
Il braccio deposita l'auto all'imbocco del posto (X = -175), ritira le
forcelle e l'auto scorre sulle rotaie fino al centro (X = -222), mantenendo
quota e orientamento. In uscita scorre prima verso l'imbocco, dove il
braccio inserisce le forcelle e la solleva. Parking/deparking durano ora
16 secondi simulati. Non si introducono soste automatiche della riproduzione.

## Due zone per ogni posto

Ogni coppia di rotaie attraversa due metà da 94 unità: transito da X = -316
a -222, parcheggio da X = -222 a -128, vicino ai numeri. L'auto in sosta
è centrata a X = -175; il braccio la prende/deposita solo a X = -269.
Le auto scorrono autonomamente per 94 unità tra le due zone, con forcelle
retratte. Il braccio attraversa prima lo spazio libero dietro la fila
(Y = 120), poi raggiunge il posto lungo la sola zona di transito.
Anche il rientro a vuoto evita la zona di parcheggio.
Le due zone sono indicate con fondi azzurro e verde e un divisorio tratteggiato.

La presa avviene dal lato corto anteriore: il polso è 10 unità oltre il
paraurti, sull'asse longitudinale dell'auto. Una traversa larga 28 unità
porta due forcelle parallele ai binari, distanti 20 unità, che entrano
sotto il telaio evitando gli pneumatici. Il polso resta dalla parte opposta
alla zona numerata, lasciando libera la marcia autonoma verso il parcheggio.

## Orientamento costante sul piano superiore

La fase turn3 è rimossa. Dalla salita dell'ascensore alla discesa l'auto
mantiene sempre orientamento π, come le auto parcheggiate. Il braccio esegue
solo traslazioni e sollevamenti, senza ruotare il carico. La piattaforma
superiore resta allineata ai binari. L'inversione di 180° per il ritorno
avviene al piano inferiore, durante swap.

## Trasferimenti senza sollevamento

Durante parking e deparking l'auto resta sempre alla quota delle rotaie:
`carElevation` è zero lungo tutto il percorso. Il braccio, con presa dal
lato corto, esegue prima lo spostamento trasversale dietro la fila, poi
quello lungo la zona di transito. Non ci sono fasi di alzata o deposito
verticale del carico. Il polso può ancora risalire durante il rientro a
vuoto; l'ascensore conserva il movimento tra piano terra e tetto.

## Carrello a livello del piano superiore

Il braccio sospeso e la colonna sono sostituiti da un carrello basso, con
una guida a L dietro la fila e lungo il bordo della zona di transito.
Il carrello resta alla quota del tetto anche nei tragitti a vuoto.
L'aggancio telescopico si inserisce longitudinalmente dal lato corto;
le forcelle si ritirano prima dello scorrimento autonomo verso i numeri.
Non sono più presenti alzate del polso né strutture sospese.

## Piattaforma rigida

Le forcelle telescopiche sono sostituite da una piattaforma rigida di
90 × 40 unità (4,5 × 2 m), collegata al carrello dal lato corto.
Il piano di appoggio coincide con la quota dei binari: nessun sollevamento
è necessario. La piattaforma accompagna l'auto fino alla zona di transito,
poi l'auto scorre autonomamente nel parcheggio. In uscita torna sulla
piattaforma prima del trasferimento all'ascensore. La piattaforma rimane
intera anche nei viaggi a vuoto, senza estensione o retrazione.

## Piattaforma corta con rotaie, separata dall'ascensore

La piattaforma misura ora 76 × 40 unità (3,8 × 2 m). Ha due binari con
interasse 31, alla stessa quota dei binari fissi. Tutte le ruote appoggiano
sulla piattaforma, con un piccolo sbalzo della carrozzeria alle estremità.
La posizione di scambio è X = -269, Y = 120: il bordo della piattaforma
resta oltre il vano e la cornice dell'ascensore. L'auto percorre autonomamente
il tratto dall'ascensore alla piattaforma ferma, che poi si muove lungo
la sola guida longitudinale di transito. Il ritorno segue la sequenza inversa.

I binari della piattaforma riutilizzano `deckOf`, come i dischi rotanti:
stesso profilo estruso, interasse, altezza, materiale metallico e bulloni.
La lunghezza è adattata alla piattaforma corta, senza dentatura circolare.

## Scambi con raccordi e interblocchi

Parking e deparking durano 44 secondi simulati ciascuno (11 secondi alla
velocità di riproduzione di base). I raccordi si estendono soltanto quando
la piattaforma è ferma e allineata, prima che l'auto inizi l'attraversamento.
Vengono ritirati prima del movimento del carrello. Due fermi ruota salgono
durante il trasporto e si abbassano prima dello scorrimento autonomo.
Una spia verde indica il freno inserito, ambra il trasferimento in corso.
La traiettoria quintica mantiene velocità e accelerazioni entro i limiti
del modello, con velocità e accelerazione nulle alle estremità dei tratti.
Il deparking ripercorre la sequenza al contrario, con gli stessi interblocchi.

Le rotaie fisse e le traversine dei posti sono presenti solo nella zona di
parcheggio, vicino ai numeri (X da -222 a -128). La zona di transito rimane
libera: conserva la guida del carrello e riceve la piattaforma con i suoi
binari mobili e raccordi.

I binari fissi dei parcheggi sono due profili metallici semplici, senza
traversine né suddivisioni laterali, con larghezza e altezza uguali a quelli
della piattaforma e dei dischi.

## Prova del modello GLB

Sotto la simulazione, `CarPreview` carica il modello Quaternius in
`public/models/quaternius-car.glb` con Three.js e camera ortografica.
L'asset originale è CC0: fonte e licenza sono in `public/models/LICENSE.txt`.
La prova permette rotazione, zoom e cambio colore, con rendering su richiesta
senza ciclo continuo. Le risorse WebGL vengono liberate allo smontaggio.
L'anteprima separata resta disponibile per esaminare il modello.

## Integrazione GLB nella simulazione

La vista principale usa `GarageThree` e `three-scene.ts`: una scena Three.js
con camera ortografica allineata alla proiezione isometrica originale.
Il GLB viene caricato una volta per scena e clonato per l'auto in movimento
e i cinque posti. Ogni clone ha materiali indipendenti per conservare i sei
colori del piano eventi. La lunghezza viene normalizzata a 84 unità (4,2 m).

Ogni fotogramma legge `stateAt(t)` e aggiorna direttamente gli oggetti Three.js:
auto, piattaforme girevoli, ascensore, carrello, raccordi e fermi ruota.
La riproduzione conserva il fattore 4×, pausa e velocità da tastiera,
rispetta la preferenza di movimento ridotto e si ferma fuori vista.
Il display mostra LIBERI o COMPLETO secondo gli stessi posti occupati.

La costante GARAGE_VIEW in `three-live.tsx` sceglie la vista iniziale
(`"3d"` per impostazione predefinita, oppure `"svg"`); non ci sono pulsanti
per cambiare vista nella pagina.
se WebGL o il caricamento GLB falliscono, si torna alla vista SVG.
Questa prima ricostruzione 3D usa geometrie semplici per l'edificio e i
meccanismi. La scena libera geometrie, materiali, texture e renderer
quando si cambia vista o si smonta il componente.

## Dettagli dello scenario 3D

I binari a terra partono appena dentro la facciata (WALL_X - 4) e terminano
a RAIL_END, prima dei dischi, senza attraversare la zona dell�ascensore. I dischi comprendono corona dentata, anelli, mozzo,
bulloni e motori laterali. Paletti gialli con fasce scure e frecce a terra
riprendono la segnaletica della vista originale.

L'edificio ha pareti laterali trasparenti con montanti, parete posteriore,
cornici delle porte, zoccoli e fasce della facciata. L'apertura del tetto
� circolare. L'insegna � montata sulla facciata, nella fascia sopra le porte, e usa
una texture senza attenuazione luminosa per mantenere leggibili i posti liberi.

Sul tetto, transito blu e parcheggio verde hanno separatori, numeri e
cordolo. Il carrello � collegato alla piattaforma da un raccordo rigido
sul lato della guida; la guida ha il tratto longitudinale e quello
trasversale verso l'ascensore. I raccordi retrattili dei binari continuano
a dipendere dagli interblocchi del modello temporale.

## Flotta GLB mista

La scena carica berlina, sportiva e SUV Quaternius dalla stessa raccolta CC0.
`car-models.ts` assegna il modello in base al numero dell'auto, alternando
le tre tipologie. Lo stesso numero conserva modello e colore durante
movimento, parcheggio e uscita. Le geometrie sono condivise fra i cloni,
i materiali sono indipendenti. Ogni modello viene centrato e appoggiato
sulle rotaie con scala uniforme entro 84 � 36 unit�, preservando le proporzioni.
