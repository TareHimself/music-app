import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import path from "path";
rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      "@redux": path.resolve(__dirname, path.join("src", "render", "redux")),
      "@hooks": path.resolve(__dirname, path.join("src", "render", "hooks")),
      "@components": path.resolve(
        __dirname,
        path.join("src", "render", "components")
      ),
      "@render": path.resolve(__dirname, path.join("src", "render")),
      "@root": path.resolve(__dirname, path.join("src")),
      "@types": path.resolve(__dirname, path.join("src", "types.ts")),
    },
  },
};
