//------------------------------------------
// Server main faile
//------------------------------------------

var express = require('express')
var JPS = {} //The global.
JPS.tests = require('../tests/tests.js')
JPS.timeHelper = require('./helpers/timeHelper.js')
JPS.errorHelper = require('./helpers/errorHelper.js')
JPS.cancelHelper = require('./helpers/cancelHelper.js')
JPS.pendingTransactionsHelper = require('./helpers/pendingTransactionsHelper.js')
JPS.mailer = require('./helpers/mailer.js')
JPS.braintree = require("braintree");

console.log("ENV: ", process.env.PWD);
if (process.env.NODE_ENV == "production") {
    JPS.firebaseConfig = {
        serviceAccount: "public/varaus.json",
        databaseURL: "https://hakolahdentie-2.firebaseio.com/",
        databaseAuthVariableOverride: {
            uid: "varausserver"
        }
    };
} else {
    JPS.firebaseConfig = {
        serviceAccount: "public/varaus-stage.json",
        databaseURL: "https://varaus-a0250.firebaseio.com/",
        databaseAuthVariableOverride: {
            uid: "varausserver"
        }
    };
}
JPS.firebase = require('firebase')
JPS.app = express();
JPS.date = new Date();
JPS.listenport = 3000
JPS.firebase.initializeApp(JPS.firebaseConfig);

/*JPS.gateway = JPS.braintree.connect({
    environment: (process.env.BRAINTREE_ENV === "production") ? JPS.braintree.Environment.Production : JPS.braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MI || "3gv7c5tq5q7hxrcs",
    publicKey: process.env.BRAINTREE_PUBK || "gksd667wsgn35wjp",
    privateKey: process.env.BRAINTREE_PRIK || "2c01703b7daffd7352eeaada7a4a95e5"
});*/

//------------------------------------------
// Process handlers
//------------------------------------------
process.on('exit', (code) => {
    console.log("Process exited with code:", code);
})


process.on('uncaughtException', (err) => {
    console.error("Caught exception:", err);
    JPS.errorHelper.logErrorToFirebase(JPS, err);
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

// HEADERS
require('./setHeaders.js').setApp(JPS);

// POST
require('./post/postNotifyRegistration.js').setApp(JPS);
require('./post/postFeedback.js').setApp(JPS);
require('./post/postPayTrailAuthCode.js').setApp(JPS);
require('./post/postCheckout.js').setApp(JPS);
require('./post/postApproveIncomplete.js').setApp(JPS);
require('./post/postCompletePaytrail.js').setApp(JPS);
require('./post/postInitializePayTrailTransaction.js').setApp(JPS);
require('./post/postInitializeDelayedTransaction.js').setApp(JPS);
require('./post/postCancelPayTrailTransaction.js').setApp(JPS);
require('./post/postCashbuy.js').setApp(JPS);
require('./post/postCancelSlot.js').setApp(JPS);
require('./post/postReserveSlot.js').setApp(JPS);
require('./post/postCancelSlot.js').setApp(JPS);
require('./post/postNotifyDelayed.js').setApp(JPS);
require('./post/postRemoveTransaction.js').setApp(JPS);
require('../tests/postTest.js').setApp(JPS);
