var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var path = require('path');

var commonLoaders = [
	{ test: /\.js$/, loader: "jsx-loader" },
	{ test: /\.png$/, loader: "url-loader" },
	{ test: /\.jpg$/, loader: "file-loader" },
];

module.exports = [
  {
	name: "joogakoulu server",
	context: path.join(__dirname, "src"),
	entry: "./server.js",
	target: "node",
	output: {
		path: __dirname + "/public/",
		filename: "index.js",
		publicPath: __dirname + "/public/",
		libraryTarget: "commonjs2"
	},
	externals: /^[a-z\-0-9]+$/,
	module: {
		loaders: commonLoaders
		}
	}];
