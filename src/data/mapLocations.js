// Map location coordinates — where each scenario's hotspot sits on
// src/assets/scenes/world_map.png. Coordinates are PERCENTAGES so the
// map scales cleanly with the canvas. The Vespa puppet centers on these
// points (its wheels land near the pin thanks to translate(-50%, -85%)
// in .vespa-wrap CSS).
//
// These were hand-placed by scanning the painted labels on world_map.png.
// If a hotspot ends up visually misaligned, tweak x/y here — no other
// file needs to change.

export const START_POSITION = { x: 50, y: 85 }; // bottom-center parking spot

export const mapLocations = {
  // Upper row
  casaMilanLive:      { x: 28, y: 25, label: 'Casa Milan' },     // "Casa Milan museum"
  // Middle row
  viaDellaSpigasLive: { x: 61, y: 47, label: 'Via della Spiga' }, // right of Duomo
  metroLive:          { x: 30, y: 54, label: 'Metro' },           // "Metro Cadorna"
  sanSiroEntry:       { x: 16, y: 66, label: 'Biglietteria' },    // ticket booth just SE of stadium
  sanSiroVendorLive:  { x: 5,  y: 65, label: 'Sciarpe' },         // vendor stall just outside the stadium
  sanSiroMatchLive:   { x: 11, y: 55, label: 'Partita' },         // inside the stadium, slightly upper
  caffeLive:          { x: 62, y: 58, label: 'Caffè' },           // under umbrella
  hotelLive:          { x: 77, y: 57, label: 'Hotel' },           // "Boutique hotel"
  duomoLive:          { x: 48, y: 62, label: 'Duomo' },           // below cathedral
  // Lower row
  trattoriaLive:      { x: 25, y: 73, label: 'Trattoria' },       // TRATTORIA awning
  navigliLive:        { x: 46, y: 74, label: 'Navigli' },         // on the canal
  bartoliniLive:      { x: 62, y: 77, label: 'Bartolini' },       // MUDEC cube
  mercatoLive:        { x: 18, y: 88, label: 'Mercato' },         // lower-left market
  // Gabriella lives on the painted balcony with the pigeons + flower boxes
  // at the bottom-right corner of the map. Pinned to her window itself
  // so the badge (notebook overlay when active queue ≥ 10) sits on the
  // sill rather than floating in the alley.
  gabriellaApartment: { x: 92, y: 75, label: 'Gabriella' }
};
