// Map location coordinates — where each scenario's hotspot sits on
// src/assets/scenes/world_map.png. Coordinates are PERCENTAGES so the
// map scales cleanly with the canvas. The Vespa puppet centers on these
// points.
//
// If a hotspot ends up visually misaligned with the map's painted label,
// just tweak x/y here — no other file needs to change.

export const START_POSITION = { x: 50, y: 88 }; // bottom-center parking spot

export const mapLocations = {
  hotel:          { x: 28, y: 22, label: 'Hotel' },
  caffe:          { x: 42, y: 48, label: 'Caffè' },
  metro:          { x: 50, y: 36, label: 'Metro' },
  duomo:          { x: 52, y: 55, label: 'Duomo' },
  mercato:        { x: 30, y: 64, label: 'Mercato' },
  trattoria:      { x: 66, y: 68, label: 'Trattoria' },
  navigli:        { x: 42, y: 80, label: 'Navigli' },
  viaDellaSpigas: { x: 64, y: 40, label: 'Via della Spiga' },
  casaMilan:      { x: 18, y: 40, label: 'Casa Milan' },
  bartolini:      { x: 22, y: 76, label: 'Bartolini' },
  sanSiro:        { x: 10, y: 55, label: 'San Siro' },
};
