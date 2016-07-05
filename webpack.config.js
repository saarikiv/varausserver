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
	plugins:[
		new CopyWebpackPlugin([
			{ from: '../keys/jooga-key.pem', to: '../public/jooga-key.pem'},
			{ from: '../keys/jooga-cert.pem', to: '../public/jooga-cert.pem'}
    	], {
    ignore: [],
    copyUnmodified: true
    })
	],
	externals: /^[a-z\-0-9]+$/,
	module: {
		loaders: commonLoaders
		}
	}];
