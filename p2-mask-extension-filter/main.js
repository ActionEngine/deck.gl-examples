import { MapboxOverlay as DeckOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { MaskExtension } from "@deck.gl/extensions";
import { load } from "@loaders.gl/core";
import { CSVLoader } from "@loaders.gl/csv";

import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

const ZIP_CODES_DATA =
  "https://raw.githubusercontent.com/ActionEngine/data-samples/refs/heads/main/csv/cdb_zcta5_fdb278bc.csv";
const POINT_DATA =
  "https://raw.githubusercontent.com/ActionEngine/data-samples/refs/heads/main/csv/osm_nodes_74461e34_000000000048.csv";

const map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  center: [-73.942046, 40.759784],
  zoom: 8,
  bearing: 0,
  pitch: 30,
});

let zipCodesData = [];
let selectedZipCodes = new Set();
let zipCodesSelectionFrame = 0;

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
      getFillColor: zipCodesSelectionFrame,
    },
  });

const getFilterLayer = () =>
  new GeoJsonLayer({
    id: "zip_codes_filter",
    data: zipCodesData.filter((row) => selectedZipCodes.has(row.id)),
    operation: "mask",
  });

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
    extensions: [new MaskExtension()],
    maskId: "zip_codes_filter",
  });

const deckOverlay = new DeckOverlay({
  // interleaved: true,
  layers: [],
  onClick: (e) => {
    if (e.layer.id === "zip_codes") {
      if (selectedZipCodes.has(e.object.id)) {
        selectedZipCodes.delete(e.object.id);
      } else {
        selectedZipCodes.add(e.object.id);
      }

      zipCodesSelectionFrame++;
      deckOverlay.setProps({
        layers: [getZipCodesLayer(), getPoisLayer(), getFilterLayer()],
      });
    }
  },
});

map.addControl(deckOverlay);

load(ZIP_CODES_DATA, CSVLoader).then((result) => {
  zipCodesData = result.data.map((row) => ({
    type: "Feature",
    id: row.geoid,
    geometry: JSON.parse(row.f0_),
    properties: {
      code: row.geoid,
    },
  }));
  deckOverlay.setProps({
    layers: [getZipCodesLayer(), getPoisLayer(), getFilterLayer()],
  });
});

