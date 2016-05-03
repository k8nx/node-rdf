var path = require('path');
var webpack = require('webpack');

var config = {
  entry: path.resolve(__dirname, 'lib/index.js'),
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'rdf.js',
    library: 'DataFrame',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [{
      test: /\.js?$/,
      loader: 'babel'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: false})
  ]
};

module.exports = config;

