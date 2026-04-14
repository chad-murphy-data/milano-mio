# Milano Mio

A conversational Italian learning app set in Milan, styled as a paper-puppet
theater. Each scenario drops you into a location (caffè, hotel lobby, Duomo,
Navigli, San Siro, …) with a character who speaks to you in Italian. The
character's hand-drawn puppet head sits on a backdrop and their paper jaw
hinges open while they talk.

Built for personal use — one learner + one friend — so the stack is
deliberately small: React + Vite on the front end, a single Netlify Function
proxying Anthropic's Claude API on the back end.

## Stack

- **Frontend**: React 18 + Vite 5
- **Backend**: Netlify Functions (`netlify/functions/marco.js`) → Anthropic API
- **Asset pipeline**: Python 3 + Pillow (`scripts/process-puppet-assets.py`)
- **Hosting**: Netlify (auto-deploy from `main`)

## Running locally

```bash
npm install
cp .env.example .env          # then fill in your keys
npm run dev
```

`.env` needs:

```
ANTHROPIC_API_KEY=sk-ant-...
APP_PASSWORD=pick-something-you-and-charlie-will-remember
```

Vite serves the frontend at `http://localhost:5173`. For the `/api/marco`
endpoint to work locally you'll want `netlify dev` instead of `npm run dev`
(it runs the function alongside Vite and applies the redirect in
`netlify.toml`).

## Project layout

```
src/
  App.jsx                      entry / routing
  screens/
    ConversationScreen.jsx     main scenario runner (wires PuppetStage)
  components/
    PuppetStage.jsx            backdrop + head + hinged jaw
    Transcript.jsx, ...
  data/
    scenarios.js               scenario index
    <location>.js              per-scenario script + character metadata
  assets/
    puppets/                   processed head/jaw PNGs + meta JSON
    scenes/                    processed backdrops
netlify/
  functions/marco.js           Claude API proxy
scripts/
  process-puppet-assets.py     raw art -> processed puppets/backdrops
puppets_raw/                   hand-drawn source PNGs (inputs to script)
```

## Puppet pipeline

Each raw puppet is one PNG with two poses side-by-side on a magenta
background (`#FF00FF`): closed mouth on the left, open mouth on the right.
Running:

```bash
python scripts/process-puppet-assets.py
```

…does the following for every puppet in `PUPPET_CONFIGS`:

1. Strips the magenta background to transparent.
2. Finds the vertical split column between the two poses.
3. Crops each half, pads both to a shared canvas (bottom-aligned, centered).
4. Estimates the jaw bbox from face proportions (or uses a manual override
   from `JAW_OVERRIDES` for puppets whose face sits off-center).
5. Writes `{key}_head.png` (closed head with the open-mouth interior pasted
   in, so teeth show through when the jaw drops), `{key}_jaw.png` (the
   movable jaw layer), and `{key}_jaw_meta.json` (canvas size + jaw bbox in
   pixel coords).
6. Resizes every backdrop to 1200 px wide and writes it to
   `src/assets/scenes/`.

Debug crops showing the detected jaw box are written to
`scripts/jaw_debug/` (gitignored).

### Adding a new puppet

1. Drop the raw two-pose PNG in `puppets_raw/`.
2. Add an entry to `PUPPET_CONFIGS` in `scripts/process-puppet-assets.py`.
3. Run the script.
4. If the jaw looks wrong, add a manual `(left, top, right, bottom)` tuple
   to `JAW_OVERRIDES` in that same file and rerun.

### Adding a new backdrop

1. Drop the raw PNG in `puppets_raw/` (or the project root).
2. Add an entry to `BACKDROP_CONFIGS` with the `key` you want the scenario
   to reference.
3. Run the script.

## Animation

The jaw is a separate sprite layered over the head with
`transform-origin: center top`. When the character is talking a recursive
`setTimeout` toggles an `.open` class on random 120–280 ms / 80–180 ms
intervals so the cadence feels uneven and hand-puppety rather than
metronomic. CSS does the rest:

```css
.puppet-jaw            { transform: translateY(0)   rotate(0); }
.puppet-jaw.open       { transform: translateY(22%) rotate(-1.5deg); }
```

The transition uses a slightly-overshooting cubic-bezier so the jaw flops
down with a tiny bounce.

## Deployment

`main` is wired to Netlify via `netlify.toml`. Pushing to `main` triggers
a build (`npm run build`) and publishes `dist/` plus the Netlify Function.
Set `ANTHROPIC_API_KEY` and `APP_PASSWORD` in the Netlify site's
environment variables.
