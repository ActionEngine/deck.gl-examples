import { CompositeLayer } from "@deck.gl/core";
import { MaskExtension } from "@deck.gl/extensions";
import { ScatterplotLayer } from "@deck.gl/layers";
import { load } from "@loaders.gl/core";
import { CSVLoader } from "@loaders.gl/csv";

export class MultiFileLayer extends CompositeLayer {
  static defaultProps = {
    data: [],
    dataUrl: "",
    maskLength: 12,
    getPosition: { type: "accessor", value: (d) => [d.longitude, d.latitude] },
    getRadius: 4,
    getFillColor: [255, 140, 0, 202],
    getLineColor: [140, 140, 0, 255],
    getLineWidth: 10,
    radiusScale: 1,
    maskId: "",
    loaders: [CSVLoader],
  };

  constructor(props) {
    super(props);
    this.state = { subLayerData: [], currentDataUrl: "", loadingFrame: 0 };
  }

  updateState({ props, changeFlags }) {
    if (props.dataUrl && props.dataUrl !== this.state.currentDataUrl) {
      this.setState({ subLayerData: [], currentDataUrl: props.dataUrl });
      this.currentDataUrl = props.dataUrl;
      async function loadAllFiles() {
        for (let i = 0; i < 100; i++) {
          const index = i.toString().padStart(props.maskLength, "0");
          const result = await load(
            this.state.currentDataUrl.replace("*", index),
            CSVLoader
          );
          const newSublayerData = this.state.subLayerData ?? [];
          for (const row of result.data) {
            newSublayerData.push(row);
          }
          this.setState({
            subLayerData: newSublayerData,
            loadingFrame: this.state.loadingFrame++,
          });
        }
      }
      loadAllFiles.call(this);
    }
  }

  renderLayers() {
    return [
      new ScatterplotLayer({
        id: `${this.props.id}-POIs`,
        data: this.state.subLayerData,

        stroked: true,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: this.props.getRadius,
        getFillColor: this.props.getFillColor,
        getLineColor: this.props.getLineColor,
        getLineWidth: this.props.getLineWidth,
        radiusScale: this.props.radiusScale,

        extensions: [new MaskExtension()],
        updateTriggers: {
          getPosition: [this.state.loadingFrame],
        },
        maskId: this.props.maskId,
      }),
    ];
  }
}
MultiFileLayer.layerName = "MultiFileLayer";
