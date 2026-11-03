# March Tower Area Map (CYMR)

An interactive training map built around **March, Manitoba (CYMR)** – the fictional airport used in the NAV CANADA Basic Airport Control Course. It plots every location from the Lesson 102 airport-identifier table relative to March, lets you drop and annotate your own pins, and quizzes you on radials, distances and directions.

> Training aid only. Not for operational use.

## Features

- **Map of Canada centred on CYMR** – 58 locations from the lesson table, colour-coded: regional (≤ 200 NM), distant (> 200 NM) and fictional training sites (CCL4, CKL7, CKE1, CEV4, CEB2, CEH1, CNW5, CJP1, CSS9, CEM6, CWS4).
- **Control zone, range rings and compass rose** – 5 NM Class D CZ, 10/25/50/100 NM rings, radials every 10° with labels every 30°.
- **Click any airport** – shows its YMR radial, distance and compass sector, and draws the line from March.
- **Live readout** – move the cursor and the status bar shows the radial/distance from YMR under it.
- **My Pins** – drop pins anywhere, give them a title and notes, drag to reposition, colour-code them. Saved in your browser; export/import as JSON for backup or to move between devices. Landmark names from the 5 NM / 10 NM maps are offered as quick-picks.
- **Learn tab** – five quiz modes (decode ident, radial & distance, find it on the map, which direction, airline call signs), a March fact sheet, and a "who is in which direction" cheat sheet by compass sector.
- **Measure tool** – distance (NM / km) and true/magnetic bearing between any two points.
- **Basemaps** – light (default), OpenStreetMap, topographic, satellite imagery, dark.
- Tahoma throughout, responsive down to phone width.

## Run it locally

It is a static site – no build step, no dependencies to install.

```bash
# any static server works, e.g.
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly from disk also works in most browsers.

## Deploy to Render (static site)

1. Push this folder to a GitHub repository.
2. In Render: **New → Static Site**, connect the repo.
3. Settings:
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.`
4. Deploy. Render will also pick up `render.yaml` automatically if you use **New → Blueprint**.

Every push to the connected branch redeploys.

## Project layout

```
.
├── index.html          # page markup
├── css/styles.css      # all styling (Tahoma, navy/accent palette)
├── js/data.js          # March constants, 58 locations, landmarks, airline designators
├── js/app.js           # map, pins, quizzes, measure tool
├── render.yaml         # Render static-site blueprint
└── README.md
```

## Data notes

- Radials and distances are the values from the Lesson 102 table (bearing **from** the YMR VOR, nautical miles). Checked against real-world coordinates: all real airports agree within 1–2° and under 1% distance, so the table's radials behave as true bearings.
- Real airports are plotted at their real coordinates. Fictional sites are placed at their published radial/distance from March (N 51°14′48″ W 96°00′12″).
- March variation is 5° E; the measure tool shows both true and magnetic bearings.
- Local landmark positions (water tower, smokestacks, bridges…) are not published in the lesson – that's what the pins are for.

## Customising

- Add or edit locations in `js/data.js` (`LOCATIONS`). Give real sites `lat`/`lon`; give fictional ones `fictional: true` and they'll be positioned from `radial`/`dist`.
- Colours and fonts live at the top of `css/styles.css` as CSS variables.

## Credits

Map tiles © OpenStreetMap contributors, © CARTO, © OpenTopoMap, © Esri. Mapping by [Leaflet](https://leafletjs.com). Course material © NAV CANADA.
