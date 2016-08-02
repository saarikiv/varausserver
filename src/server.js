//------------------------------------------
// Server main faile
//------------------------------------------

var express = require('express')
var JPS = {} //The global.
JPS.timeHelper = require('./timeHelper.js')
JPS.cancelHelper = require('./cancelHelper.js')
JPS.pendingTransactionsHelper = require('./pendingTransactionsHelper.js')
JPS.mailer = require('./mailer.js')
JPS.braintree = require("braintree");

console.log("ENV: ", process.env.PWD);
if (process.env.NODE_ENV == "production") {
    JPS.firebaseConfig = {
        serviceAccount: "public/joogakoulusilta.json",
        databaseURL: "https://joogakoulusilta-654a9.firebaseio.com",
        databaseAuthVariableOverride: {
            uid: "joogaserver"
        }
    };
} else {
    JPS.firebaseConfig = {
        serviceAccount: "public/joogakoulusilta-projekti.json",
        databaseURL: "https://joogakoulusilta-projekti.firebaseio.com",
        databaseAuthVariableOverride: {
            uid: "joogaserver"
        }
    };
}
JPS.firebase = require('firebase')
JPS.app = express();
JPS.date = new Date();
JPS.listenport = 3000
JPS.firebase.initializeApp(JPS.firebaseConfig);
JPS.gateway = JPS.braintree.connect({
    environment: (process.env.BRAINTREE_ENV === "production") ? JPS.braintree.Environment.Production : JPS.braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MI || "3gv7c5tq5q7hxrcs",
    publicKey: process.env.BRAINTREE_PUBK || "gksd667wsgn35wjp",
    privateKey: process.env.BRAINTREE_PRIK || "2c01703b7daffd7352eeaada7a4a95e5"
});
//------------------------------------------
// Process handlers
//------------------------------------------
process.on('exit', (code) => {
    console.log("Process exited with code:", code);
})


process.on('uncaughtException', (err) => {
    console.error("Caught exception:", err);
    JPS.firebase.database().ref('/serverError/' + Date.now()).update({
        error: err.toString()
    }, err => {
        if (err) {
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
    if (process.env.NODE_ENV == "production") {
        console.log("Running against production firebase.");
    } else {
        console.log("Running against stage firebase.");
    }
    console.log(JPS.firebaseConfig);
});


JPS.mailer.initializeMail(JPS);

// Add headers
require('./setHeaders.js').setApp(JPS);

// Get client token
require('./getClientToken.js').setApp(JPS);

// Get paytrail notification
require('./getPayTrailNotification.js').setApp(JPS);

// Get paytrail auth code
require('./postPayTrailAuthCode.js').setApp(JPS);

// POST checkout
require('./postCheckout.js').setApp(JPS);

// POST checkout
require('./postApproveIncomplete.js').setApp(JPS);

// POST complete paytrail
require('./postCompletePaytrail.js').setApp(JPS);

// POST init paytrail
require('./postInitializePayTrailTransaction.js').setApp(JPS);

// POST cancel paytrail
require('./postCancelPayTrailTransaction.js').setApp(JPS);

// POST CashBuy
require('./postCashbuy.js').setApp(JPS);

// POST CancelCourse
require('./postCancelCourse.js').setApp(JPS);

// POST reserve slot
require('./postReserveSlot.js').setApp(JPS);

// POST reserve slot
require('./postCancelSlot.js').setApp(JPS);