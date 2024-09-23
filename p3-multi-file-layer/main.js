import { MapboxOverlay as DeckOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { GeoJsonLayer } from "@deck.gl/layers";
import { load } from "@loaders.gl/core";
import { CSVLoader } from "@loaders.gl/csv";

import { MultiFileLayer } from "./multi-file-layer";

import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

const ZIP_CODES_DATA =
  "https://raw.githubusercontent.com/ActionEngine/data-samples/refs/heads/main/csv/cdb_zcta5_fdb278bc.csv";
const POINT_DATA =
  "PUT CARTO CSV URL MASK HERE";

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

const getPointsLayer = () =>
  new MultiFileLayer({
    id: "filtered_points",
    dataUrl: POINT_DATA,
    maskLength: 12,
    maskId: "zip_codes_filter",
    filterData: zipCodesData.filter((row) => selectedZipCodes.has(row.id)),
  });

const deckOverlay = new DeckOverlay({
  layers: [],
  onClick: (e) => {
    if (e.layer?.id === "zip_codes") {
      if (selectedZipCodes.has(e.object.id)) {
        selectedZipCodes.delete(e.object.id);
      } else {
        selectedZipCodes.add(e.object.id);
      }

      zipCodesSelectionFrame++;
      deckOverlay.setProps({
        layers: [getZipCodesLayer(), getFilterLayer(), getPointsLayer()],
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
    layers: [getZipCodesLayer(), getFilterLayer(), getPointsLayer()],
  });
});

