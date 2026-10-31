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
