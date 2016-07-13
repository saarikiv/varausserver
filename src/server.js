//------------------------------------------
// Server main faile
//------------------------------------------

var express = require('express')
var JPS = {} //The global.
JPS.timeHelper = require('./timeHelper.js')

JPS.braintree = require("braintree");

console.log("ENV: ", process.env.PWD);
if(process.env.NODE_ENV == "production") {
  JPS.firebaseConfig = {
    serviceAccount: "public/joogakoulusilta.json",
    databaseURL: "https://joogakoulusilta-654a9.firebaseio.com",
    databaseAuthVariableOverride: { uid: "joogaserver" }
  };
}
else {
  JPS.firebaseConfig = {
    serviceAccount: "public/joogakoulusilta-projekti.json",
    databaseURL: "https://joogakoulusilta-projekti.firebaseio.com",
    databaseAuthVariableOverride: { uid: "joogaserver" }
  };
}
JPS.firebase = require('firebase')
JPS.app = express();
JPS.date = new Date();
JPS.listenport = 3000
JPS.firebase.initializeApp(JPS.firebaseConfig);
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
JPS.recursionPotential = false;
process.on('uncaughtException', (err) => {
  console.error("Caught exception:", err);
  JPS.firebase.database().ref('/serverError/' + Date.now()).update({error: err.toString()}, err => {
    if(err){
      console.error("Writing error to firebase failed: ", err);
    }
  })
})

console.log("PROCESS: ", process);

//Get port primarily from Environment
JPS.app.set('port', (process.env.PORT || JPS.listenport));

JPS.app.use(express.static(__dirname + '/public'));

JPS.app.listen(JPS.app.get('port'), function() {
  console.log('Node app is running on port', JPS.app.get('port'));
  if(process.env.NODE_ENV == "production") {
    console.log("Running against production firebase.");
  } else {
    console.log("Running against stage firebase.");
  }
  console.log(JPS.firebaseConfig);
});


// Add headers
require('./setHeaders.js').setApp(JPS);

// Get client token
require('./getClientToken.js').setApp(JPS);

// POST checkout
require('./postCheckout.js').setApp(JPS);

// POST reserve slot
require('./postReserveSlot.js').setApp(JPS);

// POST reserve slot
require('./postCancelSlot.js').setApp(JPS);
