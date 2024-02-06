import path from "path";
import { fileURLToPath } from "url";
import TerserJSPlugin from "terser-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { SvgSpritePlugin } from "webpack-svg-sprite-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  context: __dirname,
  entry: {
    index: `${path.resolve(__dirname, "./src/index.tsx")}`,
    entry: `${path.resolve(__dirname, "./src/entrypoint/index.tsx")}`,
  },
  cache: {
    type: "filesystem",
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".jsx": [".js", ".ts", ".tsx"],
      ".cjs": [".cjs", ".cts"],
      ".mjs": [".mjs", ".mts"],
    },
  },
  module: {
    rules: [
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "webpack-svg-sprite-loader",
          },
        ],
      },
    ],
  },
  plugins: [new SvgSpritePlugin(), new HtmlWebpackPlugin()],
  stats: {
    builtAt: false,
    assets: true,
    colors: true,
    hash: false,
    timings: false,
    chunks: false,
    chunkModules: false,
    modules: false,
    children: false,
    entrypoints: false,
    excludeAssets: /.map$/,
    assetsSort: "!size",
  },
  optimization: {
    minimizer: [
      new TerserJSPlugin({
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    chunkIds: "deterministic", // or 'named'
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    providedExports: false,
    mangleWasmImports: true,
    splitChunks: false,
  },
};
