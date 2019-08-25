const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = {
  devServer: {
    contentBase: "./dist"
  },
  optimization: {
    minimizer: [new TerserJSPlugin({
      terserOptions: {
        module: true,
      },
    }), new OptimizeCSSAssetsPlugin({})],
  },
  plugins: [
    new HtmlWebpackPlugin(
      {
        inlineSource: ".(js|css)$",
        title: "Infinite Missiles",
        meta: { viewport: "width=device-width, initial-scale=1" }
      }
      ),
    new HtmlWebpackInlineSourcePlugin(),
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: { hmr: false },
          },
          "css-loader",
        ],
      },
      {
        test: /\.glsl$/i,
        use: "raw-loader",
      },
    ],
  },
}