import { MapboxOverlay as DeckOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { MaskExtension } from "@deck.gl/extensions";
import { load } from "@loaders.gl/core";
import { CSVLoader } from "@loaders.gl/csv";

import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

// Polygon data
const ZIP_CODES_DATA =
  "https://raw.githubusercontent.com/ActionEngine/data-samples/refs/heads/main/csv/cdb_zcta5_fdb278bc.csv";
// OSM Nodes data (latitude/longintude)
const POINT_DATA =
  "https://raw.githubusercontent.com/ActionEngine/data-samples/refs/heads/main/csv/osm_nodes_74461e34_000000000048.csv";

// Create a basemap
const map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  center: [-73.942046, 40.759784],
  zoom: 8,
  bearing: 0,
  pitch: 30,
});

// Polygon data will be loaded asyncronously
let zipCodesData = [];

// Keep selected polygon ids in a Set to have a distinct list of ids.
let selectedZipCodes = new Set();

// Selection frame is to update polygons when selection has changed
let zipCodesSelectionFrame = 0;

// Polygons layer creator. We wrap it in a function to create a new instance when deck.gl re-render
const getZipCodesLayer = () =>
  new GeoJsonLayer({
    id: "zip_codes",
    data: zipCodesData,

    stroked: false,
    filled: true,
    pickable: true,

    getFillColor: (d) =>
      selectedZipCodes.has(d.id) ? [0, 0, 255, 255] : [160, 160, 180, 200],
    autoHighlight: true,
    updateTriggers: {
      // Register the trigger that will cause the color update when `zipCodesSelectionFrame` is changing
      getFillColor: zipCodesSelectionFrame,
    },
  });

// Mask layer creator. This one won't be shown on the map but used by the POIs layer for filtering
const getFilterLayer = () =>
  new GeoJsonLayer({
    id: "zip_codes_filter",
    // Take only selected polygons
    data: zipCodesData.filter((row) => selectedZipCodes.has(row.id)),
    operation: "mask",
  });

// Pois layer creator
const getPoisLayer = () =>
  new ScatterplotLayer({
    id: "POIs",
    data: POINT_DATA,

    stroked: true,
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: 10,
    getFillColor: [255, 140, 0],
    getLineColor: [0, 0, 0],
    getLineWidth: 10,
    radiusScale: 6,
    pickable: true,
    loaders: [CSVLoader],
    // Add mask extension for filtering
    extensions: [new MaskExtension()],
    // Filter layer id
    maskId: "zip_codes_filter",
  });

// Create deck.gl engine
const deckOverlay = new DeckOverlay({
  layers: [],
  // We handle click event globally
  onClick: (e) => {
    if (e.layer.id === "zip_codes") {
      if (selectedZipCodes.has(e.object.id)) {
        // Unselect polygon
        selectedZipCodes.delete(e.object.id);
      } else {
        // Select polygon
        selectedZipCodes.add(e.object.id);
      }

      // Incremet selection frame to cause the color update
      zipCodesSelectionFrame++;
      // Update layers
      deckOverlay.setProps({
        layers: [getZipCodesLayer(), getPoisLayer(), getFilterLayer()],
      });
    }
  },
});

// Connect the basemap and deck.gl
map.addControl(deckOverlay);

// Use @loaders.gl API to load an parse CSV file
load(ZIP_CODES_DATA, CSVLoader).then((result) => {
  // Transform csv tabular data to GeoJSON features
  zipCodesData = result.data.map((row) => ({
    type: "Feature",
    id: row.geoid,
    geometry: JSON.parse(row.f0_),
    properties: {
      code: row.geoid,
    },
  }));
  // Update layers
  deckOverlay.setProps({
    layers: [getZipCodesLayer(), getPoisLayer(), getFilterLayer()],
  });
});

