var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var commonLoaders = [
	{ test: /\.js$/, loader: "jsx-loader" },
	{ test: /\.png$/, loader: "url-loader" },
	{ test: /\.jpg$/, loader: "file-loader" },
];

module.exports = [
  {
	name: "varaus server",
	context: path.join(__dirname, "src"),
	entry: "./server.js",
	target: "node",
	output: {
		path: __dirname + "/public/",
		filename: "index.js",
		publicPath: __dirname + "/public/",
		libraryTarget: "commonjs2"
	},
	plugins:[
	new webpack.optimize.DedupePlugin(),
	new webpack.optimize.OccurenceOrderPlugin(),
	//new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
	new CopyWebpackPlugin([
		{ from: './keys/varaus.json', to: '../public/varaus.json'},
		{ from: './keys/varaus-stage.json', to: '../public/varaus-stage.json'}
	])],
	externals: /^[a-z\-0-9]+$/,
	module: {
		loaders: commonLoaders
		}
	}];
