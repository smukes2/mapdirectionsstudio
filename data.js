/* =====================================================================
   March Tower (CYMR) – Area Map Data
   Source: NAV CANADA Basic Airport Control Course, Lesson 102 (The Basics)
   Radials are the course-table values (bearing FROM the YMR VOR, degrees).
   Distances are in nautical miles (NM).
   Real airports use real-world coordinates; fictional training sites are
   positioned from their radial/distance off March at load time (see app.js).
   ===================================================================== */

const MARCH = {
  id: 'CYMR',
  name: 'March, Manitoba',
  lat: 51 + 14 / 60 + 48 / 3600,        // N 51 14 48
  lon: -(96 + 0 / 60 + 12 / 3600),      // W 96 00 12
  elevFt: 750,
  magVarEast: 5,                         // 5° E
  czRadiusNM: 5,
  czCapFt: 3800,
  classCFloorFt: 3500,
  surveillanceFloorFt: 1100,
  freqs: { tower: '118.2', ground: '121.9', midtownCentre: '127.4' },
  runways: [
    { id: '09', hdg: 90,  len: 8800, wid: 200 },
    { id: '27', hdg: 270, len: 8800, wid: 200 },
    { id: '14', hdg: 143, len: 6900, wid: 200 },
    { id: '32', hdg: 323, len: 6900, wid: 200 }
  ]
};

/* id, name, radial (from YMR), dist (NM), lat/lon for real sites, fictional flag */
const LOCATIONS = [
  { id: 'CYBV', name: 'Berens River',               radial: 330, dist: 77,   lat: 52.359, lon: -97.018 },
  { id: 'CYTL', name: 'Big Trout Lake',             radial: 52,  dist: 271,  lat: 53.818, lon: -89.897 },
  { id: 'CYBR', name: 'Brandon',                    radial: 242, dist: 171,  lat: 49.910, lon: -99.952 },
  { id: 'CYYC', name: 'Calgary',                    radial: 275, dist: 679,  lat: 51.114, lon: -114.020 },
  { id: 'CYAC', name: 'Cat Lake',                   radial: 77,  dist: 159,  lat: 51.727, lon: -91.824 },
  { id: 'CCL4', name: 'Noname Lake',                radial: 66,  dist: 29,   fictional: true },
  { id: 'CYYQ', name: 'Churchill',                  radial: 6,   dist: 455,  lat: 58.739, lon: -94.065 },
  { id: 'CYDN', name: 'Dauphin',                    radial: 267, dist: 153,  lat: 51.101, lon: -100.053 },
  { id: 'CYHD', name: 'Dryden',                     radial: 122, dist: 150,  lat: 49.832, lon: -92.744 },
  { id: 'CYEG', name: 'Edmonton Intl',              radial: 286, dist: 658,  lat: 53.310, lon: -113.580 },
  { id: 'CZVL', name: 'Edmonton Villeneuve',        radial: 288, dist: 669,  lat: 53.667, lon: -113.853 },
  { id: 'CKL7', name: 'Eganville',                  radial: 183, dist: 23,   fictional: true },
  { id: 'CKE1', name: 'Eureka',                     radial: 84,  dist: 25,   fictional: true },
  { id: 'CEV4', name: 'Evelyn',                     radial: 325, dist: 6,    fictional: true },
  { id: 'KFAR', name: 'Fargo',                      radial: 186, dist: 262,  lat: 46.921, lon: -96.816 },
  { id: 'CYFO', name: 'Flin Flon',                  radial: 316, dist: 291,  lat: 54.678, lon: -101.682 },
  { id: 'CYAG', name: 'Fort Frances',               radial: 145, dist: 185,  lat: 48.654, lon: -93.440 },
  { id: 'CYGX', name: 'Gillam',                     radial: 7,   dist: 310,  lat: 56.357, lon: -94.711 },
  { id: 'CYGM', name: 'Gimli',                      radial: 226, dist: 54,   lat: 50.628, lon: -97.043 },
  { id: 'KGFK', name: 'Grand Forks',                radial: 192, dist: 203,  lat: 47.949, lon: -97.176 },
  { id: 'CYHZ', name: 'Halifax Intl',               radial: 92,  dist: 1350, lat: 44.881, lon: -63.509 },
  { id: 'CYHM', name: 'Hamilton',                   radial: 119, dist: 814,  lat: 43.174, lon: -79.935 },
  { id: 'KINL', name: 'International Falls',        radial: 146, dist: 190,  lat: 48.566, lon: -93.403 },
  { id: 'CYFB', name: 'Iqaluit',                    radial: 37,  dist: 1148, lat: 63.756, lon: -68.556 },
  { id: 'CYIV', name: 'Island Lake',                radial: 16,  dist: 164,  lat: 53.857, lon: -94.654 },
  { id: 'CYQK', name: 'Kenora',                     radial: 143, dist: 108,  lat: 49.788, lon: -94.363 },
  { id: 'CYAX', name: 'Lac du Bonnet',              radial: 179, dist: 57,   lat: 50.294, lon: -96.010 },
  { id: 'CEB2', name: 'Lakeburn',                   radial: 217, dist: 11,   fictional: true },
  { id: 'CZGR', name: 'Little Grand Rapids',        radial: 21,  dist: 52,   lat: 52.046, lon: -95.466 },
  { id: 'CYYL', name: 'Lynn Lake',                  radial: 333, dist: 382,  lat: 56.864, lon: -101.076 },
  { id: 'CEH1', name: 'March Hospital',             radial: 64,  dist: 4,    fictional: true },
  { id: 'CYMJ', name: 'Moose Jaw',                  radial: 263, dist: 368,  lat: 50.330, lon: -105.559 },
  { id: 'CYQM', name: 'Moncton',                    radial: 90,  dist: 1273, lat: 46.112, lon: -64.679 },
  { id: 'CYUL', name: 'Montreal Trudeau',           radial: 101, dist: 951,  lat: 45.470, lon: -73.741 },
  { id: 'CNW5', name: 'Northwest Station',          radial: 318, dist: 26,   fictional: true },
  { id: 'CYNE', name: 'Norway House',               radial: 337, dist: 176,  lat: 53.958, lon: -97.844 },
  { id: 'CYOW', name: 'Ottawa Intl',                radial: 105, dist: 885,  lat: 45.323, lon: -75.669 },
  { id: 'CJP1', name: 'Peace Hill',                 radial: 358, dist: 18,   fictional: true },
  { id: 'CYPL', name: 'Pickle Lake',                radial: 83,  dist: 218,  lat: 51.446, lon: -90.214 },
  { id: 'CYPA', name: 'Prince Albert',              radial: 291, dist: 375,  lat: 53.214, lon: -105.673 },
  { id: 'CYRL', name: 'Red Lake',                   radial: 95,  dist: 84,   lat: 51.067, lon: -93.793 },
  { id: 'CYQR', name: 'Regina',                     radial: 264, dist: 333,  lat: 50.432, lon: -104.666 },
  { id: 'CSS9', name: 'Saturday',                   radial: 149, dist: 24,   fictional: true },
  { id: 'CYXE', name: 'Saskatoon',                  radial: 281, dist: 403,  lat: 52.171, lon: -106.700 },
  { id: 'CYAM', name: 'Sault Ste Marie',            radial: 116, dist: 537,  lat: 46.485, lon: -84.509 },
  { id: 'CYXL', name: 'Sioux Lookout',              radial: 111, dist: 171,  lat: 50.114, lon: -91.905 },
  { id: 'CEM6', name: 'South March Hospital',       radial: 159, dist: 6,    fictional: true },
  { id: 'CYYT', name: "St. John's",                 radial: 79,  dist: 1683, lat: 47.619, lon: -52.752 },
  { id: 'CYAV', name: 'St. Andrews',                radial: 208, dist: 82,   lat: 50.056, lon: -97.033 },
  { id: 'CYSB', name: 'Sudbury',                    radial: 108, dist: 661,  lat: 46.625, lon: -80.799 },
  { id: 'CYQD', name: 'The Pas',                    radial: 312, dist: 248,  lat: 53.971, lon: -101.091 },
  { id: 'CYTH', name: 'Thompson',                   radial: 346, dist: 282,  lat: 55.801, lon: -97.864 },
  { id: 'CYQT', name: 'Thunder Bay',                radial: 120, dist: 312,  lat: 48.372, lon: -89.324 },
  { id: 'CYYZ', name: 'Toronto Pearson',            radial: 117, dist: 804,  lat: 43.677, lon: -79.631 },
  { id: 'CYVR', name: 'Vancouver Intl',             radial: 273, dist: 1049, lat: 49.195, lon: -123.179 },
  { id: 'CWS4', name: 'Westville',                  radial: 276, dist: 27,   fictional: true },
  { id: 'CYWG', name: 'Winnipeg Intl',              radial: 210, dist: 93,   lat: 49.910, lon: -97.240 },
  { id: 'CYQV', name: 'Yorkton',                    radial: 272, dist: 243,  lat: 51.265, lon: -102.462 }
];

/* Visual reporting points / landmarks from the 5 NM & 10 NM March maps.
   Exact positions are not published in the lesson – drop your own pins for
   these as you learn the control zone. Offered as quick-pick names. */
const LANDMARKS = [
  'Radio Tower', 'Water Tower', 'Industrial Park', 'Fuel Farm', 'Civic Centre',
  'Hospital (CEH1)', 'Hotel', 'Cemetery', 'Gas Station', 'Shopping Centre',
  'Golf Course', 'Golf Course Rd Intersection', 'Airport Rd Intersection',
  'Causeway', 'Smokestacks', 'First Bridge', 'Second Bridge', 'Arrow Dam',
  'South March Hospital (CEM6)', 'Evelyn (CEV4)', 'Lakeburn (CEB2)',
  'Training Area', 'Fire Training Area', 'VOR Site', 'Radar Site',
  'Localizer Road', 'Glide Path Road', 'Helipad'
];

/* Airline telephony / ICAO designators seen at March (Lesson 102, EO 102.5) */
const AIRLINES = [
  { code: 'AAL',  telephony: 'American' },
  { code: 'ACA',  telephony: 'Air Canada' },
  { code: 'BLS',  telephony: 'Bearskin' },
  { code: 'CAV',  telephony: 'Calm Air' },
  { code: 'CFC',  telephony: 'Canforce' },
  { code: 'CJT',  telephony: 'Cargojet' },
  { code: 'DAL',  telephony: 'Delta' },
  { code: 'FAB',  telephony: 'First Air' },
  { code: 'FDX',  telephony: 'FedEx' },
  { code: 'GGN',  telephony: 'Great North' },
  { code: 'HUSK', telephony: 'Husky' },
  { code: 'JZA',  telephony: 'Jazz' },
  { code: 'NAL',  telephony: 'Northway' },
  { code: 'NVC',  telephony: 'Nav Can' },
  { code: 'SLQ',  telephony: 'Skylink' },
  { code: 'TGO',  telephony: 'Transport' },
  { code: 'TSC',  telephony: 'Transat' },
  { code: 'UAL',  telephony: 'United' },
  { code: 'UPS',  telephony: 'UPS (U-P-S)' },
  { code: 'WJA',  telephony: 'WestJet' },
  { code: 'POE',  telephony: 'Porter' }
];
