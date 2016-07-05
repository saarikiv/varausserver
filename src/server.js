//------------------------------------------
// Server main faile
//------------------------------------------

var express = require('express')
var JPS = {} //The global.

JPS.http = require('http')
JPS.https = require('https')
JPS.fs = require('fs')
JPS.braintree = require("braintree");
JPS.firebaseConfig = {
  apiKey: "AIzaSyCq544Yq7EEY-5spIe1oFCe8gkOzRkS5ak",
  authDomain: "joogakoulusilta-projekti.firebaseapp.com",
  databaseURL: "https://joogakoulusilta-projekti.firebaseio.com",
  storageBucket: "joogakoulusilta-projekti.appspot.com",
};
JPS.firebase = require('firebase')
JPS.app = express();
JPS.httplistenport = 3000
JPS.httpslistenport = 3443
JPS.firebase.initializeApp(JPS.firebaseConfig);
JPS.TransactionRef = JPS.firebase.database().ref('/transactions/')
JPS.ShopItemsRef = JPS.firebase.database().ref('/shopItems/')
JPS.BookingRef = JPS.firebase.database().ref('/bookings/')
JPS.gateway = JPS.braintree.connect({
  environment: JPS.braintree.Environment.Sandbox,
  merchantId: "3gv7c5tq5q7hxrcs",
  publicKey: "gksd667wsgn35wjp",
  privateKey: "2c01703b7daffd7352eeaada7a4a95e5"
});

//------------------------------------------
// Process handlers
//------------------------------------------
process.on('exit', (code) => {
  console.log("Process exited with code:", code);
})
process.on('uncaughtException', (err) => {
  console.log("Caught exception:", err);
})


/*
// For HTTPS - TODO
const options = {
  key: fs.readFileSync('keys/jooga-key.pem'),
  cert: fs.readFileSync('keys/jooga-cert.pem')
};
*/

JPS.http.createServer(JPS.app).listen(JPS.httplistenport, (err) => {
  if(err) throw err;
  console.log("Listenig on: ", JPS.httplistenport);
});
//JPS.https.createServer(options, JPS.app).listen(443);

// Add headers
require('./setHeaders.js').setApp(JPS)

// Get client token
require('./getClientToken.js').setApp(JPS);

// POST checkout
require('./postCheckout.js').setApp(JPS);

// POST reserve slot
require('./postReserveSlot.js').setApp(JPS);
