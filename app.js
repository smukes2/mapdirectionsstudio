/* =====================================================================
   March Tower Area Map – application
   Vanilla JS + Leaflet. No build step.
   ===================================================================== */
(function () {
  'use strict';
  function init() {

  /* ---------------- geodesy ---------------- */
  const R_NM = 3440.065;                 // Earth radius in nautical miles
  const NM_M = 1852;                     // metres per NM
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;

  function distNM(a, b) {
    const p1 = toRad(a.lat), p2 = toRad(b.lat);
    const dp = toRad(b.lat - a.lat), dl = toRad(b.lon - a.lon);
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * R_NM * Math.asin(Math.sqrt(h));
  }
  function bearingTrue(a, b) {
    const p1 = toRad(a.lat), p2 = toRad(b.lat), dl = toRad(b.lon - a.lon);
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  function destination(a, brg, d) {
    const dr = d / R_NM, t = toRad(brg), p1 = toRad(a.lat), l1 = toRad(a.lon);
    const p2 = Math.asin(Math.sin(p1) * Math.cos(dr) + Math.cos(p1) * Math.sin(dr) * Math.cos(t));
    const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(dr) * Math.cos(p1), Math.cos(dr) - Math.sin(p1) * Math.sin(p2));
    return { lat: toDeg(p2), lon: ((toDeg(l2) + 540) % 360) - 180 };
  }
  const pad3 = n => String(((Math.round(n) % 360) + 360) % 360).padStart(3, '0');
  const SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const SECTOR_NAMES = { N: 'North', NE: 'North-east', E: 'East', SE: 'South-east', S: 'South', SW: 'South-west', W: 'West', NW: 'North-west' };
  const sectorOf = brg => SECTORS[Math.round(((brg % 360) + 360) % 360 / 45) % 8];
  const fmtLat = v => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'N' : 'S'}`;
  const fmtLon = v => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'E' : 'W'}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- data prep ---------------- */
  LOCATIONS.forEach(loc => {
    if (loc.fictional) {
      const p = destination(MARCH, loc.radial, loc.dist);
      loc.lat = p.lat; loc.lon = p.lon;
    }
    loc.calcRadial = bearingTrue(MARCH, loc);
    loc.calcDist = distNM(MARCH, loc);
    loc.sector = sectorOf(loc.radial);
  });
  LOCATIONS.sort((a, b) => a.dist - b.dist);
  const byId = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));

  /* ---------------- DOM helpers ---------------- */
  const $ = id => document.getElementById(id);
  let toastTimer;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  /* ---------------- map ---------------- */
  const map = L.map('map', { zoomControl: true, worldCopyJump: false, minZoom: 3, maxZoom: 18 })
    .setView([MARCH.lat, MARCH.lon], 8);
  L.control.scale({ imperial: false, metric: true }).addTo(map);

  const basemaps = {
    streets: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors, and the GIS User Community' }),
    light: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ' }),
    dark: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ' }),
    osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17, attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>' }),
    imagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community' })
  };
  let currentBase = basemaps.streets.addTo(map);
  $('basemap').addEventListener('change', e => {
    map.removeLayer(currentBase);
    currentBase = basemaps[e.target.value].addTo(map);
  });

  /* overlays: control zone, rings, rose */
  const czLayer = L.layerGroup();
  const ringLayer = L.layerGroup();
  const roseLayer = L.layerGroup();

  const circleNM = (nm, opts) => L.circle([MARCH.lat, MARCH.lon], Object.assign({ radius: nm * NM_M }, opts));
  const boundsNM = nm => L.latLngBounds([0, 90, 180, 270].map(b => { const p = destination(MARCH, b, nm); return [p.lat, p.lon]; }));
  const labelAt = (pt, text, cls) => L.marker([pt.lat, pt.lon], {
    interactive: false, icon: L.divIcon({ className: cls, html: text, iconSize: null, iconAnchor: [0, 0] })
  });

  circleNM(MARCH.czRadiusNM, { color: '#1f5fa8', weight: 2, fillColor: '#1f5fa8', fillOpacity: .08, interactive: false }).addTo(czLayer);
  labelAt(destination(MARCH, 180, MARCH.czRadiusNM), `CZ 5 NM · Class D · SFC–${MARCH.czCapFt}'`, 'ring-label').addTo(czLayer);

  [10, 25, 50, 100].forEach(nm => {
    circleNM(nm, { color: '#5a6b80', weight: 1, dashArray: '4 6', fill: false, interactive: false }).addTo(ringLayer);
    labelAt(destination(MARCH, 135, nm), `${nm} NM`, 'ring-label').addTo(ringLayer);
  });

  for (let brg = 0; brg < 360; brg += 10) {
    const major = brg % 30 === 0;
    const start = destination(MARCH, brg, major ? 5 : 20);
    const end = destination(MARCH, brg, 25);
    L.polyline([[start.lat, start.lon], [end.lat, end.lon]], {
      color: major ? '#5a6b80' : '#9aa7b8', weight: major ? 1 : .8, opacity: .8, interactive: false
    }).addTo(roseLayer);
    if (major) labelAt(destination(MARCH, brg, 26.5), pad3(brg), 'radial-label').addTo(roseLayer);
  }
  czLayer.addTo(map); ringLayer.addTo(map); roseLayer.addTo(map);

  /* March marker */
  L.marker([MARCH.lat, MARCH.lon], {
    icon: L.divIcon({ className: '', html: `<div class="march-marker"><div class="ring"></div><div class="core"></div><div class="lbl">CYMR · March</div></div>`, iconSize: [0, 0], iconAnchor: [0, 0] }),
    zIndexOffset: 1000
  }).addTo(map).bindPopup(`<div class="popup"><h4>CYMR – March</h4><div class="sub">Fictional training airport · ${fmtLat(MARCH.lat)} ${fmtLon(MARCH.lon)}</div>
    <div class="rd"><div><span>Elevation</span><br><b>${MARCH.elevFt} ft</b></div><div><span>Variation</span><br><b>${MARCH.magVarEast}° E</b></div>
    <div><span>Tower</span><br><b>${MARCH.freqs.tower}</b></div><div><span>Ground</span><br><b>${MARCH.freqs.ground}</b></div></div>
    <div class="sub">Runways 09/27 (8800 × 200) · 14/32 (6900 × 200)</div></div>`);

  /* ---------------- airport markers ---------------- */
  const localLayer = L.layerGroup().addTo(map);     // real, ≤ 200 NM
  const distantLayer = L.layerGroup().addTo(map);   // real, > 200 NM
  const fictLayer = L.layerGroup().addTo(map);      // fictional training sites
  const markers = {};
  let selectedId = null;
  let selLine = null;

  function aptIcon(loc, selected) {
    const cls = loc.fictional ? 'fict' : (loc.dist > 200 ? 'far' : 'near');
    return L.divIcon({
      className: '', iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -8],
      html: `<div class="apt-marker ${cls}${selected ? ' sel' : ''}"><span class="dot"></span><span class="lbl">${loc.id}</span></div>`
    });
  }
  function popupHtml(loc) {
    const diffNote = loc.fictional ? '' : `<div class="sub">Measured: R${pad3(loc.calcRadial)} · ${loc.calcDist.toFixed(0)} NM</div>`;
    return `<div class="popup"><h4>${loc.id} – ${esc(loc.name)}</h4>
      <div class="sub">${loc.fictional ? 'Fictional training site · ' : ''}${fmtLat(loc.lat)} ${fmtLon(loc.lon)} · ${SECTOR_NAMES[loc.sector]} of March</div>
      <div class="rd"><div><span>YMR radial</span><br><b>${pad3(loc.radial)}</b></div><div><span>Distance</span><br><b>${loc.dist} NM</b></div></div>
      ${diffNote}
      <div class="actions"><button class="btn" data-act="line" data-id="${loc.id}">Show line from March</button><button class="btn" data-act="quiz" data-id="${loc.id}">Quiz me on this</button></div></div>`;
  }
  LOCATIONS.forEach(loc => {
    const m = L.marker([loc.lat, loc.lon], { icon: aptIcon(loc, false), title: `${loc.id} ${loc.name}` });
    m.bindPopup(() => popupHtml(loc), { maxWidth: 300 });
    m.on('click', e => {
      if (mode !== 'none') { m.closePopup(); handleMapClick(e.latlng); return; }   // pin / measure / locate modes
      selectLocation(loc.id, { fly: false, line: true });
    });
    const layer = loc.fictional ? fictLayer : (loc.dist > 200 ? distantLayer : localLayer);
    m.addTo(layer);
    m._homeLayer = layer;
    markers[loc.id] = m;
  });
  map.on('popupopen', e => {
    const node = e.popup.getElement();
    node.querySelectorAll('button[data-act]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (btn.dataset.act === 'line') selectLocation(id, { fly: true, line: true });
      if (btn.dataset.act === 'quiz') { openTab('learn'); quiz.startWith(id); }
    }));
  });

  function drawLine(from, to, text, cls) {
    const line = L.polyline([[from.lat, from.lon], [to.lat, to.lon]], { color: '#d9480f', weight: 2.5, opacity: .9, dashArray: '8 6' });
    const mid = L.latLng((from.lat + to.lat) / 2, (from.lon + to.lon) / 2);
    line.bindTooltip(text, { permanent: true, direction: 'center', className: 'line-label ' + (cls || '') , offset: [0, 0] });
    line.addTo(map);
    line.openTooltip(mid);
    return line;
  }
  function clearSelection() {
    if (selectedId && markers[selectedId]) markers[selectedId].setIcon(aptIcon(byId[selectedId], false));
    if (selLine) { map.removeLayer(selLine); selLine = null; }
    selectedId = null;
    document.querySelectorAll('.loc-row.selected').forEach(r => r.classList.remove('selected'));
  }
  function selectLocation(id, opts = {}) {
    const loc = byId[id]; if (!loc) return;
    clearSelection();
    selectedId = id;
    markers[id].setIcon(aptIcon(loc, true));
    if (opts.line !== false) selLine = drawLine(MARCH, loc, `R${pad3(loc.radial)} · ${loc.dist} NM · ${SECTOR_NAMES[loc.sector]}`);
    const row = document.querySelector(`.loc-row[data-id="${id}"]`);
    if (row) { row.classList.add('selected'); if (opts.scroll) row.scrollIntoView({ block: 'nearest' }); }
    if (opts.fly) {
      map.fitBounds(L.latLngBounds([[MARCH.lat, MARCH.lon], [loc.lat, loc.lon]]).pad(0.35), { maxZoom: 11 });
    }
    if (opts.popup) markers[id].openPopup();
  }

  /* ---------------- location list ---------------- */
  let locFilter = 'all', locQuery = '';
  function renderLocList() {
    const q = locQuery.trim().toLowerCase();
    const rows = LOCATIONS.filter(l => {
      if (locFilter === 'local' && l.dist > 30) return false;
      if (locFilter === 'regional' && l.dist > 200) return false;
      if (locFilter === 'distant' && l.dist <= 200) return false;
      if (locFilter === 'fictional' && !l.fictional) return false;
      if (q && !(l.id.toLowerCase().includes(q) || l.name.toLowerCase().includes(q))) return false;
      return true;
    });
    $('locList').innerHTML = rows.map(l => `
      <li class="loc-row${l.id === selectedId ? ' selected' : ''}" data-id="${l.id}">
        <span class="ident">${l.id}</span>
        <span class="name">${esc(l.name)}${l.fictional ? '<span class="badge-fict">training</span>' : ''}<small>${SECTOR_NAMES[l.sector]}</small></span>
        <span class="rd"><b>R${pad3(l.radial)}</b><br>${l.dist} NM</span>
      </li>`).join('');
    $('locCount').textContent = `${rows.length} location${rows.length === 1 ? '' : 's'}`;
  }
  $('locList').addEventListener('click', e => {
    const row = e.target.closest('.loc-row'); if (!row) return;
    selectLocation(row.dataset.id, { fly: true, line: true, popup: true });
  });
  $('locSearch').addEventListener('input', e => { locQuery = e.target.value; renderLocList(); });
  $('locFilters').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    document.querySelectorAll('#locFilters .chip').forEach(c => c.classList.toggle('active', c === chip));
    locFilter = chip.dataset.filter; renderLocList();
  });
  renderLocList();

  /* ---------------- pins ---------------- */
  const PIN_KEY = 'cymr.pins.v1';
  let pins = [];
  try { pins = JSON.parse(localStorage.getItem(PIN_KEY) || '[]'); } catch { pins = []; }
  const pinLayer = L.layerGroup().addTo(map);
  const pinMarkers = {};
  let editingPin = null, pendingLatLng = null;

  function pinIcon(color) {
    return L.divIcon({
      className: 'pin-icon', iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30],
      html: `<svg viewBox="0 0 26 34" width="26" height="34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/><circle cx="13" cy="13" r="5.5" fill="#fff"/></svg>`
    });
  }
  function savePins() { localStorage.setItem(PIN_KEY, JSON.stringify(pins)); }
  function pinPopup(p) {
    const d = distNM(MARCH, p), b = bearingTrue(MARCH, p);
    return `<div class="popup"><h4>${esc(p.title || 'Untitled pin')}</h4>
      <div class="sub">From YMR: R${pad3(b)} · ${d < 10 ? d.toFixed(1) : d.toFixed(0)} NM · ${SECTOR_NAMES[sectorOf(b)]}</div>
      ${p.notes ? `<div class="notes">${esc(p.notes)}</div>` : ''}
      <div class="actions"><button class="btn" data-pin-act="edit" data-id="${p.id}">Edit</button><button class="btn" data-pin-act="line" data-id="${p.id}">Line from March</button></div></div>`;
  }
  function renderPins() {
    pinLayer.clearLayers();
    Object.keys(pinMarkers).forEach(k => delete pinMarkers[k]);
    pins.forEach(p => {
      const m = L.marker([p.lat, p.lon], { icon: pinIcon(p.color), draggable: true, title: p.title });
      m.bindPopup(() => pinPopup(p), { maxWidth: 280 });
      m.on('dragend', () => { const ll = m.getLatLng(); p.lat = ll.lat; p.lon = ll.lng; savePins(); renderPinList(); toast('Pin moved'); });
      m.addTo(pinLayer); pinMarkers[p.id] = m;
    });
    renderPinList();
  }
  function renderPinList() {
    const list = $('pinList');
    $('pinEmpty').hidden = pins.length > 0;
    $('pinCount').textContent = `${pins.length} pin${pins.length === 1 ? '' : 's'}`;
    list.innerHTML = pins.map(p => {
      const d = distNM(MARCH, p), b = bearingTrue(MARCH, p);
      return `<li class="pin-row" data-id="${p.id}">
        <span class="swatch" style="background:${p.color}"></span>
        <div><div class="pin-title">${esc(p.title || 'Untitled pin')}</div>
          <div class="pin-meta">R${pad3(b)} · ${d < 10 ? d.toFixed(1) : d.toFixed(0)} NM ${SECTOR_NAMES[sectorOf(b)]}</div>
          ${p.notes ? `<div class="pin-notes">${esc(p.notes)}</div>` : ''}</div>
        <div class="pin-actions"><button class="link-btn" data-pin-act="edit" data-id="${p.id}">Edit</button></div></li>`;
    }).join('');
  }
  $('pinList').addEventListener('click', e => {
    const btn = e.target.closest('[data-pin-act]');
    if (btn) { openPinModal(pins.find(p => p.id === btn.dataset.id)); return; }
    const row = e.target.closest('.pin-row'); if (!row) return;
    const p = pins.find(x => x.id === row.dataset.id);
    map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 12));
    pinMarkers[p.id].openPopup();
  });
  map.on('popupopen', e => {
    e.popup.getElement().querySelectorAll('button[data-pin-act]').forEach(btn => btn.addEventListener('click', () => {
      const p = pins.find(x => x.id === btn.dataset.id); if (!p) return;
      if (btn.dataset.pinAct === 'edit') openPinModal(p);
      if (btn.dataset.pinAct === 'line') {
        clearSelection();
        selLine = drawLine(MARCH, p, `R${pad3(bearingTrue(MARCH, p))} · ${distNM(MARCH, p).toFixed(1)} NM`);
      }
    }));
  });

  /* pin modal */
  $('landmarkList').innerHTML = LANDMARKS.map(n => `<option value="${esc(n)}">`).join('');
  function openPinModal(pin, latlng) {
    editingPin = pin || null;
    pendingLatLng = latlng || (pin ? { lat: pin.lat, lng: pin.lon } : null);
    $('pinModalTitle').textContent = pin ? 'Edit pin' : 'New pin';
    $('pinTitle').value = pin ? pin.title : '';
    $('pinNotes').value = pin ? pin.notes : '';
    $('pinColor').value = pin ? pin.color : '#d9480f';
    $('pinDelete').hidden = !pin;
    const d = distNM(MARCH, { lat: pendingLatLng.lat, lon: pendingLatLng.lng });
    const b = bearingTrue(MARCH, { lat: pendingLatLng.lat, lon: pendingLatLng.lng });
    $('pinCoords').textContent = `${fmtLat(pendingLatLng.lat)} ${fmtLon(pendingLatLng.lng)} · R${pad3(b)} / ${d.toFixed(1)} NM`;
    $('pinModal').hidden = false;
    setTimeout(() => $('pinTitle').focus(), 30);
  }
  function closePinModal() { $('pinModal').hidden = true; editingPin = null; pendingLatLng = null; }
  $('pinCancel').addEventListener('click', closePinModal);
  $('pinModal').addEventListener('click', e => { if (e.target === $('pinModal')) closePinModal(); });
  $('pinSave').addEventListener('click', () => {
    const title = $('pinTitle').value.trim() || 'Untitled pin';
    const notes = $('pinNotes').value.trim();
    const color = $('pinColor').value;
    if (editingPin) { Object.assign(editingPin, { title, notes, color }); toast('Pin updated'); }
    else {
      pins.push({ id: 'p' + Date.now().toString(36), title, notes, color, lat: pendingLatLng.lat, lon: pendingLatLng.lng, created: new Date().toISOString() });
      toast('Pin added');
    }
    savePins(); renderPins(); closePinModal();
  });
  $('pinDelete').addEventListener('click', () => {
    if (!editingPin) return;
    pins = pins.filter(p => p.id !== editingPin.id);
    savePins(); renderPins(); closePinModal(); toast('Pin deleted');
  });
  $('btnClearPins').addEventListener('click', () => {
    if (!pins.length) return;
    if (confirm(`Delete all ${pins.length} pins? Export them first if you want a backup.`)) { pins = []; savePins(); renderPins(); toast('All pins deleted'); }
  });
  $('btnPinAtMarch').addEventListener('click', () => openPinModal(null, { lat: MARCH.lat, lng: MARCH.lon }));

  /* export / import */
  $('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), airport: 'CYMR', pins }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cymr-pins.json'; a.click();
    URL.revokeObjectURL(a.href);
  });
  $('fileImport').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const incoming = Array.isArray(data) ? data : data.pins;
        if (!Array.isArray(incoming)) throw new Error('bad');
        let added = 0;
        incoming.forEach(p => {
          if (typeof p.lat !== 'number' || typeof p.lon !== 'number') return;
          if (pins.some(x => x.id === p.id)) return;
          pins.push({ id: p.id || 'p' + Math.random().toString(36).slice(2), title: String(p.title || ''), notes: String(p.notes || ''), color: p.color || '#d9480f', lat: p.lat, lon: p.lon, created: p.created || new Date().toISOString() });
          added++;
        });
        savePins(); renderPins(); toast(`Imported ${added} pin${added === 1 ? '' : 's'}`);
      } catch { toast('Could not read that file'); }
      e.target.value = '';
    };
    r.readAsText(f);
  });
  renderPins();

  /* ---------------- map modes (pin / measure / locate) ---------------- */
  let mode = 'none';
  const banner = $('modeBanner');
  function setMode(m, text) {
    mode = m;
    banner.textContent = text || ''; banner.classList.toggle('show', !!text);
    document.body.classList.toggle('crosshair', m !== 'none');
    $('tbPin').classList.toggle('active', m === 'pin');
    $('btnPinMode').classList.toggle('active', m === 'pin');
    $('tbMeasure').classList.toggle('active', m === 'measure');
    $('btnMeasure').classList.toggle('active', m === 'measure');
    map.getContainer().style.cursor = m === 'none' ? '' : 'crosshair';
  }
  const togglePin = () => mode === 'pin' ? setMode('none') : setMode('pin', 'Click the map to drop a pin · Esc to cancel');
  $('tbPin').addEventListener('click', togglePin);
  $('btnPinMode').addEventListener('click', togglePin);

  let measurePts = [], measureLine = null, measureMarkers = [];
  function clearMeasure() {
    measurePts = [];
    if (measureLine) { map.removeLayer(measureLine); measureLine = null; }
    measureMarkers.forEach(m => map.removeLayer(m)); measureMarkers = [];
    $('measureOut').innerHTML = '';
  }
  const toggleMeasure = () => {
    if (mode === 'measure') { setMode('none'); return; }
    clearMeasure(); setMode('measure', 'Click the first point, then the second · Esc to cancel');
    openTab('tools');
  };
  $('tbMeasure').addEventListener('click', toggleMeasure);
  $('btnMeasure').addEventListener('click', toggleMeasure);
  $('btnMeasureClear').addEventListener('click', () => { clearMeasure(); if (mode === 'measure') setMode('none'); });

  function measureClick(ll) {
    const pt = { lat: ll.lat, lon: ll.lng };
    measurePts.push(pt);
    measureMarkers.push(L.circleMarker(ll, { radius: 5, color: '#d9480f', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(map));
    const dM = distNM(MARCH, pt), bM = bearingTrue(MARCH, pt);
    if (measurePts.length === 1) {
      $('measureOut').innerHTML = `<div><b>Point A</b> ${fmtLat(pt.lat)} ${fmtLon(pt.lon)}<br><span class="muted">From YMR: R${pad3(bM)} · ${dM.toFixed(1)} NM</span></div><div class="muted small" style="margin-top:6px">Now click point B…</div>`;
      return;
    }
    const a = measurePts[0], b = measurePts[1];
    const d = distNM(a, b), brg = bearingTrue(a, b), rec = (brg + 180) % 360;
    measureLine = drawLine(a, b, `${d.toFixed(1)} NM · ${pad3(brg)}° T`, 'measure-label');
    $('measureOut').innerHTML = `
      <div class="big">${d.toFixed(1)} NM <span class="muted small">(${(d * 1.852).toFixed(1)} km)</span></div>
      <div><b>Bearing A → B:</b> ${pad3(brg)}° True · ${pad3(brg - MARCH.magVarEast)}° Mag</div>
      <div><b>Reciprocal B → A:</b> ${pad3(rec)}° True · ${pad3(rec - MARCH.magVarEast)}° Mag</div>
      <div class="muted small" style="margin-top:6px"><b>A</b> ${fmtLat(a.lat)} ${fmtLon(a.lon)} — from YMR R${pad3(bearingTrue(MARCH, a))} / ${distNM(MARCH, a).toFixed(1)} NM<br>
      <b>B</b> ${fmtLat(b.lat)} ${fmtLon(b.lon)} — from YMR R${pad3(bM)} / ${dM.toFixed(1)} NM</div>
      <div class="muted small" style="margin-top:6px">Click the map again to start a new measurement.</div>`;
    measurePts = [];
    measureMarkers.forEach(m => map.removeLayer(m)); measureMarkers = [];
    setMode('none');
  }

  function handleMapClick(latlng) {
    if (mode === 'pin') { setMode('none'); openPinModal(null, latlng); }
    else if (mode === 'measure') measureClick(latlng);
    else if (mode === 'locate') quiz.locateGuess(latlng);
  }
  map.on('click', e => handleMapClick(e.latlng));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('pinModal').hidden) closePinModal();
      else if (mode !== 'none') { if (mode === 'measure') clearMeasure(); if (mode === 'locate') quiz.cancelLocate(); setMode('none'); }
    }
  });

  /* ---------------- status bar ---------------- */
  let quizHidesReadout = false;
  map.on('mousemove', e => {
    const pt = { lat: e.latlng.lat, lon: e.latlng.lng };
    const d = distNM(MARCH, pt), b = bearingTrue(MARCH, pt);
    $('stCursor').textContent = `Cursor ${fmtLat(pt.lat)} ${fmtLon(pt.lon)}`;
    $('stFromMarch').textContent = quizHidesReadout
      ? 'From YMR — hidden while a question is open'
      : `From YMR R${pad3(b)} · ${d < 10 ? d.toFixed(1) : d.toFixed(0)} NM · ${SECTOR_NAMES[sectorOf(b)]}`;
  });
  const updZoom = () => { $('stZoom').textContent = `Zoom ${map.getZoom()}`; };
  map.on('zoomend', updZoom); updZoom();

  /* toolbar */
  $('tbHome').addEventListener('click', () => map.flyTo([MARCH.lat, MARCH.lon], 11));
  $('tbFitLocal').addEventListener('click', () => map.fitBounds(boundsNM(25)));
  $('tbFitAll').addEventListener('click', () => map.fitBounds(L.latLngBounds(LOCATIONS.map(l => [l.lat, l.lon])).pad(0.05)));

  /* layer toggles */
  const bind = (id, layer) => $(id).addEventListener('change', e => e.target.checked ? layer.addTo(map) : map.removeLayer(layer));
  bind('tgCZ', czLayer); bind('tgRings', ringLayer); bind('tgRose', roseLayer);
  bind('tgFict', fictLayer); bind('tgDistant', distantLayer);
  $('tgLabels').addEventListener('change', e => map.getContainer().classList.toggle('hide-labels', !e.target.checked));

  /* ---------------- sidebar tabs ---------------- */
  function openTab(name) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
    $('sidebar').classList.remove('collapsed');
    setTimeout(() => map.invalidateSize(), 260);
  }
  document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) openTab(b.dataset.tab); });
  $('btnSidebar').addEventListener('click', () => { $('sidebar').classList.toggle('collapsed'); setTimeout(() => map.invalidateSize(), 260); });

  /* ---------------- facts & sector sheet ---------------- */
  $('marchFacts').innerHTML = [
    ['Elevation', `${MARCH.elevFt} ft ASL`], ['Variation', `${MARCH.magVarEast}° E`],
    ['Control zone', `Class D · 5 NM · to ${MARCH.czCapFt}' ASL`], ['Class C above', `${MARCH.classCFloorFt}' ASL outside CZ`],
    ['Tower', MARCH.freqs.tower], ['Ground', MARCH.freqs.ground],
    ['Midtown Centre', MARCH.freqs.midtownCentre], ['Surveillance from', `${MARCH.surveillanceFloorFt}' ASL`],
    ['Rwy 09/27', '090° / 270° · 8800 × 200'], ['Rwy 14/32', '143° / 323° · 6900 × 200'],
    ['Class E', '700\' AGL to 3500\' ASL outside CZ'], ['Circuit', 'Right-hand Rwy 27 & 32']
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  $('sectorSheet').innerHTML = SECTORS.map(s => {
    const items = LOCATIONS.filter(l => l.sector === s);
    const range = { N: '338–022', NE: '023–067', E: '068–112', SE: '113–157', S: '158–202', SW: '203–247', W: '248–292', NW: '293–337' }[s];
    return `<div class="sector"><h4>${SECTOR_NAMES[s]}<span>${range}</span></h4>${items.map(l => `<a data-id="${l.id}"><b>${l.id}</b> ${esc(l.name)} · ${l.dist}</a>`).join('')}</div>`;
  }).join('');
  $('sectorSheet').addEventListener('click', e => { const a = e.target.closest('a[data-id]'); if (a) selectLocation(a.dataset.id, { fly: true, line: true, popup: true, scroll: true }); });

  /* ---------------- quiz ---------------- */
  const QKEY = 'cymr.quiz.v1';
  const quiz = (() => {
    let score = { correct: 0, total: 0, streak: 0 };
    try { score = Object.assign(score, JSON.parse(localStorage.getItem(QKEY) || '{}')); } catch { /* ignore */ }
    let current = null, answered = false, guessMarker = null, guessLine = null, actualHalo = null, hiddenTarget = null;
    function hideTarget(loc) {           // any location question: hide the answer and all idents
      map.closePopup(); clearSelection();
      const mk = markers[loc.id];
      if (mk._homeLayer.hasLayer(mk)) mk._homeLayer.removeLayer(mk);
      hiddenTarget = loc;
      map.getContainer().classList.add('hide-labels');
      quizHidesReadout = true;
    }
    function restoreTarget() {
      if (!hiddenTarget) return;
      const mk = markers[hiddenTarget.id];
      if (!mk._homeLayer.hasLayer(mk)) mk._homeLayer.addLayer(mk);   // group only shows it if that group is on the map
      hiddenTarget = null;
      quizHidesReadout = false;
      if ($('tgLabels').checked) map.getContainer().classList.remove('hide-labels');
    }
    const body = $('quizBody');
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    function pool() {
      const p = $('quizPool').value;
      if (p === 'fictional') return LOCATIONS.filter(l => l.fictional);
      if (p === 'all') return LOCATIONS.slice();
      return LOCATIONS.filter(l => l.dist <= Number(p));
    }
    function saveScore() { localStorage.setItem(QKEY, JSON.stringify(score)); $('quizScore').textContent = `${score.correct} / ${score.total}`; }
    function record(ok) { score.total++; if (ok) { score.correct++; score.streak++; } else score.streak = 0; saveScore(); }
    function cleanupMap() {
      [guessMarker, guessLine, actualHalo].forEach(x => x && map.removeLayer(x));
      guessMarker = guessLine = actualHalo = null;
      restoreTarget();
      if (mode === 'locate') setMode('none');
    }
    function feedback(ok, html) {
      body.insertAdjacentHTML('beforeend', `<div class="feedback ${ok ? 'ok' : 'bad'}">${html}</div><div class="streak">Streak: ${score.streak}</div>`);
      $('btnQuizNext').disabled = false; answered = true;
    }
    function reveal(loc) { restoreTarget(); selectLocation(loc.id, { fly: true, line: true }); }

    function next(forceId) {
      cleanupMap(); answered = false; $('btnQuizNext').disabled = true;
      const m = $('quizMode').value;
      if (m === 'airline') return askAirline();
      const p = pool();
      if (!p.length) { body.innerHTML = '<div class="quiz-prompt">No locations in this pool.</div>'; return; }
      let loc = forceId ? byId[forceId] : null;
      if (!loc) { do { loc = p[Math.floor(Math.random() * p.length)]; } while (p.length > 1 && current && loc.id === current.id); }
      current = loc;
      hideTarget(loc);
      ({ identify: askIdentify, radial: askRadial, locate: askLocate, sector: askSector })[m](loc);
    }

    function askIdentify(loc) {
      const others = shuffle(LOCATIONS.filter(l => l.id !== loc.id)).slice(0, 3);
      const opts = shuffle([loc, ...others]);
      body.innerHTML = `<div class="quiz-prompt">Which airport is this?</div><div class="quiz-big">${loc.id}</div>
        <div class="options">${opts.map(o => `<button data-id="${o.id}">${esc(o.name)}</button>`).join('')}</div>`;
      body.querySelectorAll('.options button').forEach(btn => btn.addEventListener('click', () => {
        if (answered) return;
        const ok = btn.dataset.id === loc.id;
        body.querySelectorAll('.options button').forEach(b => { b.disabled = true; if (b.dataset.id === loc.id) b.classList.add('correct'); else if (b === btn) b.classList.add('wrong'); });
        record(ok); reveal(loc);
        feedback(ok, `${ok ? 'Correct.' : 'Not quite.'} <b>${loc.id}</b> is ${esc(loc.name)} – R${pad3(loc.radial)}, ${loc.dist} NM, ${SECTOR_NAMES[loc.sector].toLowerCase()} of March.`);
      }));
    }

    function askRadial(loc) {
      body.innerHTML = `<div class="quiz-prompt">Radial and distance from YMR?</div><div class="quiz-big">${loc.id}</div><div class="quiz-sub">${esc(loc.name)}</div>
        <div class="quiz-inputs"><label>Radial<input id="qRadial" type="number" min="0" max="360" placeholder="000"></label>
        <label>Distance (NM)<input id="qDist" type="number" min="0" placeholder="NM"></label><button id="qCheck" class="btn primary">Check</button></div>`;
      const check = () => {
        if (answered) return;
        const r = Number($('qRadial').value), d = Number($('qDist').value);
        if (!$('qRadial').value || !$('qDist').value) { toast('Enter both values'); return; }
        let dr = Math.abs(((r - loc.radial) % 360 + 540) % 360 - 180);
        const dTol = Math.max(5, loc.dist * 0.15);
        const okR = dr <= 10, okD = Math.abs(d - loc.dist) <= dTol, ok = okR && okD;
        record(ok); reveal(loc);
        feedback(ok, `${ok ? 'Correct.' : 'Not quite.'} <b>${loc.id}</b> is on the <b>${pad3(loc.radial)}</b> radial at <b>${loc.dist} NM</b>
          (you said ${pad3(r)} / ${d}). Radial ${okR ? '✓' : `off by ${dr}°`} · distance ${okD ? '✓' : `off by ${Math.abs(d - loc.dist)} NM`}. Tolerance ±10° / ±15%.`);
      };
      $('qCheck').addEventListener('click', check);
      body.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
      $('qRadial').focus();
    }

    function askLocate(loc) {
      body.innerHTML = `<div class="quiz-prompt">Click on the map where you think this is.</div><div class="quiz-big">${loc.id}</div><div class="quiz-sub">${esc(loc.name)}</div>
        <div class="muted small">Tip: it's on the ${pad3(loc.radial)} radial. Use the compass rose and range rings.</div>`;
      map.fitBounds(boundsNM(Math.max(30, loc.dist * 1.3)));
      setMode('locate', `Click where ${loc.id} is · Esc to cancel`);
    }
    function locateGuess(ll) {
      if (answered || !current || $('quizMode').value !== 'locate') return;
      const g = { lat: ll.lat, lon: ll.lng }, loc = current;
      const err = distNM(g, loc);
      const tol = Math.max(8, loc.dist * 0.12);
      const ok = err <= tol;
      guessMarker = L.circleMarker(ll, { radius: 7, color: ok ? '#2b8a3e' : '#c92a2a', fillColor: '#fff', fillOpacity: 1, weight: 3 }).addTo(map);
      actualHalo = L.circle([loc.lat, loc.lon], { radius: tol * NM_M, color: '#2b8a3e', weight: 1, dashArray: '4 4', fillOpacity: .06 }).addTo(map);
      guessLine = L.polyline([[g.lat, g.lon], [loc.lat, loc.lon]], { color: ok ? '#2b8a3e' : '#c92a2a', weight: 2, dashArray: '4 6' }).addTo(map);
      setMode('none'); restoreTarget();
      record(ok); selectLocation(loc.id, { fly: false, line: true });
      map.fitBounds(L.latLngBounds([[MARCH.lat, MARCH.lon], [loc.lat, loc.lon], [g.lat, g.lon]]).pad(0.3));
      feedback(ok, `${ok ? 'Close enough.' : 'Missed.'} Your guess was <b>${err.toFixed(0)} NM</b> from ${loc.id} (target circle ${tol.toFixed(0)} NM). ${loc.id} is R${pad3(loc.radial)} / ${loc.dist} NM.`);
    }

    function askSector(loc) {
      const correct = loc.sector;
      body.innerHTML = `<div class="quiz-prompt">Which direction from March?</div><div class="quiz-big">${loc.id}</div><div class="quiz-sub">${esc(loc.name)} · ${loc.dist} NM</div>
        <div class="options" style="grid-template-columns:1fr 1fr 1fr 1fr">${SECTORS.map(s => `<button data-s="${s}" style="text-align:center">${s}</button>`).join('')}</div>`;
      body.querySelectorAll('.options button').forEach(btn => btn.addEventListener('click', () => {
        if (answered) return;
        const ok = btn.dataset.s === correct;
        body.querySelectorAll('.options button').forEach(b => { b.disabled = true; if (b.dataset.s === correct) b.classList.add('correct'); else if (b === btn) b.classList.add('wrong'); });
        record(ok); reveal(loc);
        feedback(ok, `${ok ? 'Correct.' : 'Not quite.'} ${loc.id} is <b>${SECTOR_NAMES[correct].toLowerCase()}</b> of March on the ${pad3(loc.radial)} radial.`);
      }));
    }

    function askAirline() {
      const a = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
      current = null;
      const askCode = Math.random() < 0.5;
      const others = shuffle(AIRLINES.filter(x => x.code !== a.code)).slice(0, 3);
      const opts = shuffle([a, ...others]);
      body.innerHTML = `<div class="quiz-prompt">${askCode ? 'Which telephony goes with this designator?' : 'Which designator goes with this call sign?'}</div>
        <div class="quiz-big">${askCode ? a.code : esc(a.telephony)}</div>
        <div class="options">${opts.map(o => `<button data-c="${o.code}">${askCode ? esc(o.telephony) : o.code}</button>`).join('')}</div>`;
      body.querySelectorAll('.options button').forEach(btn => btn.addEventListener('click', () => {
        if (answered) return;
        const ok = btn.dataset.c === a.code;
        body.querySelectorAll('.options button').forEach(b => { b.disabled = true; if (b.dataset.c === a.code) b.classList.add('correct'); else if (b === btn) b.classList.add('wrong'); });
        record(ok);
        feedback(ok, `${ok ? 'Correct.' : 'Not quite.'} <b>${a.code}</b> = ${esc(a.telephony)}.`);
      }));
    }

    $('btnQuizStart').addEventListener('click', () => next());
    $('btnQuizNext').addEventListener('click', () => next());
    $('btnQuizReset').addEventListener('click', () => { score = { correct: 0, total: 0, streak: 0 }; saveScore(); toast('Score reset'); });
    $('quizMode').addEventListener('change', () => { cleanupMap(); body.innerHTML = ''; $('btnQuizNext').disabled = true; });
    saveScore();
    body.innerHTML = '<div class="quiz-prompt">Pick a mode and pool, then press <b>Start</b>. Enter checks an answer; Next moves on.</div>';
    return {
      startWith: id => {
        map.closePopup();
        if (!['radial', 'sector', 'locate'].includes($('quizMode').value)) $('quizMode').value = 'radial';
        next(id);
        const loc = byId[id]; if ($('quizMode').value !== 'locate') map.fitBounds(boundsNM(Math.max(30, loc.dist * 1.3)));
      },
      locateGuess,
      cancelLocate: () => { restoreTarget(); body.insertAdjacentHTML('beforeend', '<div class="quiz-prompt">Cancelled – press Next for another.</div>'); $('btnQuizNext').disabled = false; answered = true; }
    };
  })();

  /* initial view: 25 NM ring with a little margin */
  map.fitBounds(boundsNM(27));
  }

  if (window.L) init(); else window.__leafletReady = init;   // cdnjs fallback (see index.html)
})();
