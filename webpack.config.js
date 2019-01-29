const path = require('path');
const GasPlugin = require("gas-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: false,
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.html$/,
        loader: "html-loader"
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts'
    ]
  },
  plugins: [
    new GasPlugin(),
    new HtmlWebpackPlugin({
      filename: "init.html",
      template: "./html/init.html"
    }),
    new HtmlWebpackPlugin({
      filename: "execute.html",
      template: "./html/execute.html"
    }),
    new HtmlWebpackPlugin({
      filename: "css.html",
      template: "./html/css.html"
    })
  ]
};