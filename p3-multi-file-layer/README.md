## Example: Deck.gl multifile layer

MultifileLayer is a CompositeLayer that supports loading data from multiple csv files. It can consume a mask url like `https://site.com/.../filename_*.csv`. This url format is typical for Google BigQuery exports.

Uses [Vite](https://vitejs.dev/) to bundle and serve files.

## Usage

Or run it locally:

```bash
npm install
# or
yarn
```

Commands:
* `npm run dev` is the development target, to serve the app and hot reload.
* `npm run build` is the production target, to create the final bundle and write to disk.