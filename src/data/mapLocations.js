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
  casaMilan:      { x: 28, y: 25, label: 'Casa Milan' },     // "Casa Milan museum"
  // Middle row
  viaDellaSpigas: { x: 61, y: 47, label: 'Via della Spiga' }, // right of Duomo
  metro:          { x: 30, y: 54, label: 'Metro' },           // "Metro Cadorna"
  sanSiro:        { x: 9,  y: 60, label: 'San Siro' },        // stadium, far left
  caffe:          { x: 62, y: 58, label: 'Caffè' },           // under umbrella
  hotel:          { x: 77, y: 57, label: 'Hotel' },           // "Boutique hotel"
  duomo:          { x: 48, y: 62, label: 'Duomo' },           // below cathedral
  // Lower row
  trattoria:      { x: 25, y: 73, label: 'Trattoria' },       // TRATTORIA awning
  navigli:        { x: 46, y: 74, label: 'Navigli' },         // on the canal
  bartolini:      { x: 62, y: 77, label: 'Bartolini' },       // MUDEC cube
  mercato:        { x: 18, y: 88, label: 'Mercato' },         // lower-left market
};
