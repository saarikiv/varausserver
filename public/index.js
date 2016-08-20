module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/home/saarikiv/varausserver/public/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {//------------------------------------------
	// Server main faile
	//------------------------------------------

	var express = __webpack_require__(25)
	var JPS = {} //The global.
	JPS.tests = __webpack_require__(23)
	JPS.timeHelper = __webpack_require__(7)
	JPS.errorHelper = __webpack_require__(4)
	JPS.cancelHelper = __webpack_require__(3)
	JPS.pendingTransactionsHelper = __webpack_require__(6)
	JPS.mailer = __webpack_require__(5)
	JPS.braintree = __webpack_require__(24);

	console.log("ENV: ", process.env.PWD);
	if (process.env.NODE_ENV == "production") {
	    JPS.firebaseConfig = {
	        serviceAccount: "public/varaus.json",
	        databaseURL: "https://varaus-a0250.firebaseio.com/",
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
	JPS.firebase = __webpack_require__(26)
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
	__webpack_require__(21).setApp(JPS);

	// POST
	__webpack_require__(17).setApp(JPS);
	__webpack_require__(13).setApp(JPS);
	__webpack_require__(18).setApp(JPS);
	__webpack_require__(11).setApp(JPS);
	__webpack_require__(8).setApp(JPS);
	__webpack_require__(12).setApp(JPS);
	__webpack_require__(15).setApp(JPS);
	__webpack_require__(14).setApp(JPS);
	__webpack_require__(9).setApp(JPS);
	__webpack_require__(10).setApp(JPS);
	__webpack_require__(1).setApp(JPS);
	__webpack_require__(20).setApp(JPS);
	__webpack_require__(1).setApp(JPS);
	__webpack_require__(16).setApp(JPS);
	__webpack_require__(19).setApp(JPS);
	__webpack_require__(22).setApp(JPS);

	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 1 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cancelSlot
	    //######################################################

	    JPS.app.post('/cancelSlot', (req, res) => {
	        JPS.now = Date.now();
	        console.log("POST: cancelSlot", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            console.log("POST:", JPS.post);
	            JPS.currentUserToken = JPS.post.user;
	            JPS.slotInfo = JPS.post.slotInfo;
	            JPS.cancelItem = JPS.post.cancelItem;
	            JPS.txRef = JPS.post.transactionReference;
	            JPS.timezoneOffset = JPS.post.timezoneOffset;

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested cancel slot.");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    if (snapshot.val() != null) {
	                        JPS.user = snapshot.val();
	                        JPS.user.key = snapshot.key;
	                        console.log("USER:", JPS.user);
	                        return JPS.firebase.database().ref('/bookingsbyslot/' + JPS.slotInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key).once('value');
	                    } else {
	                        throw (new Error("User record does not exist in the database: " + JPS.currentUserUID))
	                    }
	                })
	                .then(snapshot => {
	                    if (snapshot.val() == null) {
	                        throw (new Error("Booking by-SLOT does not exist in the database."))
	                    }
	                    return JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' + JPS.slotInfo.key + '/' + JPS.cancelItem).once('value');
	                })
	                .then(snapshot => {
	                    if (snapshot.val() == null) {
	                        throw (new Error("Booking by-USER does not exist in the database."))
	                    }
	                    return JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' + JPS.slotInfo.key + '/' + JPS.cancelItem).remove();
	                })
	                .then(() => {
	                    return JPS.firebase.database().ref('/bookingsbyslot/' + JPS.slotInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key).remove();
	                })
	                .then(() => {
	                    console.log("Transaction reference: ", JPS.txRef)
	                    if (JPS.txRef != 0) {
	                        //Give back one use time for the user
	                        JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.txRef).once('value')
	                            .then(snapshot => {
	                                if (snapshot.val() == null) {
	                                    throw (new Error("Transaction not found in the DB: TX:" + JPS.user.key + "/" + JPS.txRef));
	                                }
	                                JPS.unusedtimes = snapshot.val().unusedtimes;
	                                JPS.unusedtimes++;
	                                return JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.txRef).update({
	                                    unusedtimes: JPS.unusedtimes
	                                })
	                            })
	                            .then(err => {
	                                if (err) {
	                                    throw (new Error(err.message + " " + err.code));
	                                }
	                                res.status(200).jsonp({
	                                    message: "Cancellation COUNT was succesfull."
	                                }).end();
	                                JPS.mailer.sendCancellationCount(JPS.user.email, JPS.slotInfo, JPS.cancelItem); //Send confirmation email
	                            }).catch(err => {
	                                throw (new Error(err.message + " " + err.code));
	                            })
	                    } else {
	                        res.status(200).jsonp({
	                            message: "Cancellation TIME was succesfull."
	                        }).end();
	                        JPS.mailer.sendCancellationTime(JPS.user.email, JPS.slotInfo, JPS.cancelItem); //Send confirmation email
	                    }
	                })
	                .catch(err => {
	                    console.error("POST Cancel Slot failed: ", err);
	                    res.status(500).jsonp({
	                        message: "POST Cancel Slot failed:" + err.toString()
	                    }).end();
	                });
	        })
	    })
	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("md5");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = {
	    cancelSlot: (JPS, user, slotInfo, slotInstance, transactionReference) => {

	        var promise = new Promise((resolve, reject) => {

	            console.log("USER:", user);
	            JPS.firebase.database().ref('/bookingsbyslot/' + slotInfo.key + '/' + slotInstance + '/' + user).once('value')
	            .then(snapshot => {
	                if (snapshot.val() == null) {
	                    throw (new Error("Booking by-SLOT does not exist in the database."))
	                }
	                return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + slotInfo.key + '/' + slotInstance).once('value');
	            })
	            .then(snapshot => {
	                if (snapshot.val() == null) {
	                    throw (new Error("Booking by-USER does not exist in the database."))
	                }
	                return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + slotInfo.key + '/' + slotInstance).remove();
	            })
	            .then(() => {
	                return JPS.firebase.database().ref('/bookingsbyslot/' + slotInfo.key + '/' + slotInstance + '/' + user).remove();
	            })
	            .then(() => {
	                console.log("Transaction reference: ", transactionReference)
	                if (transactionReference != 0) {
	                    //Give back one use time for the user
	                    JPS.firebase.database().ref('/transactions/' + user + '/' + transactionReference).once('value')
	                        .then(snapshot => {
	                            if (snapshot.val() == null) {
	                                throw (new Error("Transaction not found in the DB: TX:" + user + "/" + transactionReference));
	                            }
	                            JPS.unusedtimes = snapshot.val().unusedtimes;
	                            JPS.unusedtimes++;
	                            return JPS.firebase.database().ref('/transactions/' + user + '/' + transactionReference).update({
	                                unusedtimes: JPS.unusedtimes
	                            })
	                        })
	                        .then(err => {
	                            if (err) {
	                                throw (new Error(err.message + " " + err.code));
	                            }
	                            JPS.mailer.sendSlotCancellationCount(JPS.user.email, slotInfo, slotInstance); //Send confirmation email
	                        }).catch(err => {
	                            throw (new Error(err.message + " " + err.code));
	                        })
	                } else {
	                    JPS.mailer.sendSlotCancellationTime(JPS.user.email, slotInfo, slotInstance); //Send confirmation email
	                }
	            })
	            .catch(err => {
	                console.error("Cancel Slot failed: ", err);
	                reject( "cancel slot failed: " + err.toString() );
	            });
	            resolve()
	        })
	        return promise;
	    }
	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	
	module.exports = {
	    logErrorToFirebase: (JPS, error) => {
	        JPS.firebase.database().ref('/serverError/' + Date.now()).update({
	            error
	        }, err => {
	            if (err) {
	                console.error("Writing error to firebase failed: ", err);
	            }
	        })
	    }
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var JPSM = {}
	JPSM.Mailgun = __webpack_require__(27)
	JPSM.mg_api_key = process.env.MAILGUN_API_KEY || 'key-4230707292ae718f00a8274d41beb7f3';
	JPSM.mg_domain = process.env.MAILGUN_DOMAIN || 'sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
	JPSM.mg_from_who = process.env.MAILGUN_FROM_WHO || 'postmaster@sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
	JPSM.feedbackMail = process.env.FEEDBACK_ADDRESS || 'tuomo.saarikivi@outlook.com'
	JPSM.notifyMail = process.env.NOTIFY_ADDRESS || 'tuomo.saarikivi@outlook.com'
	JPSM.registrationMail = process.env.REGISTRATION_ADDRESS || 'tuomo.saarikivi@outlook.com'
	JPSM.initialized = false;

	module.exports = {

	    initializeMail: (jps) => {
	        if (!JPSM.initialized) {
	            JPSM.jps = jps;
	            JPSM.mailgun = new JPSM.Mailgun({
	                apiKey: JPSM.mg_api_key,
	                domain: JPSM.mg_domain
	            });
	        }
	        JPSM.initialized = true;
	    },

	    sendThankyouForFeedback: (user) => {
	        if (!JPSM.initialized) return;

	        console.log("sendThankyouForFeedback")
	        console.log(user)

	        JPSM.html =
	            "<h1>Kiitos palautteesta!</h1>" +
	            "<p>Olemme vastaanottaneet palautteesi ja arvostamme sitä, että käytit aikaasi antaaksesi palautetta.</p>" +
	            "<p>Teemme kaikkemme, jotta voimme palvella Sinua paremmin tulevaisuudessa.</p>" +
	            "<br>" +
	            "<p>Ystävällisin terveisin,</p>" +
	            "<p>Hakolahdentie 2</p>"

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: user.email,
	            subject: 'Kiitos palautteesta!',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-error: ", err);
	            } else {
	                console.log("MAIL-SENT: ", body);
	            }
	        });
	    },


	    sendNotifyDelayed: (user, transaction) => {
	        if (!JPSM.initialized) return;

	        console.log("sendNotifyDelayed")
	        console.log(user)
	        console.log(transaction)

	        JPSM.html =
	            "<h1>Ostoilmoitus:</h1>" +
	            "<p> Hakolahdentie 2 saunavarusjärjestelmässä odottaa osto vahvistamista.</p>" +
	            "<br>" +
	            "<p> Oston tunniste: " + transaction + "</p>" +
	            "<br>" +
	            "<p> Oston teki käyttäjä: " + user.uid + "</p>" +
	            "<p> Nimi: " + user.firstname + " " + user.lastname + "</p>" +
	            "<p> Sähköposti: " + user.email + "</p>" 
	            

	        console.log("Notification: ", JPSM.html)

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: JPSM.notifyMail,
	            subject: 'Hakolahdentie 2 oston ilmoitus',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-error: ", err);
	            } else {
	                console.log("MAIL-SENT: ", body);
	            }
	        });
	    },

	    sendFeedback: (user, feedback) => {
	        if (!JPSM.initialized) return;

	        console.log("sendFeedback")
	        console.log(user)
	        console.log(feedback)

	        JPSM.html =
	            "<h1>Palaute:</h1>" +
	            "<p>"+ feedback +"</p>" +
	            "<br>" +
	            "<p> Terveisin " + user.email + "</p>"
	        console.log("Feedback: ", JPSM.html)

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: JPSM.feedbackMail,
	            subject: 'Hakolahdentie 2 varaus palaute',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-error: ", err);
	            } else {
	                console.log("MAIL-SENT: ", body);
	            }
	        });
	    },


	    sendRegistration: (user) => {
	        if (!JPSM.initialized) return;

	        console.log("sendRegistration")
	        console.log(user)

	        JPSM.html =
	            "<h1>Rekisteröinti-ilmoitus:</h1>" +
	            "<br>" +
	            "<p> Käyttäjä:" + user.email + "</p>" +
	            "<br>" +
	            "<p> Nimi:" + user.firstname + " " + user.lastname + "</p>" +
	            "<br>" +
	            "<p> On rekisteröitynyt Hakolahdentie 2 varaus palveluun.</p>"
	        console.log("Registration: ", JPSM.html)

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: JPSM.registrationMail,
	            subject: 'Rekisteröinti imoitus',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-error: ", err);
	            } else {
	                console.log("MAIL-SENT: ", body);
	            }
	        });
	    },


	    sendConfirmation: (sendTo, slotInfo, slotTime) => {
	        if (!JPSM.initialized) return;

	        console.log("sendConfirmation")
	        console.log(sendTo)
	        console.log(slotInfo)
	        console.log(slotTime)

	        JPSM.html =
	            "<h1>Varauksen vahvistus</h1>" +
	            "<p>Saunavuoron varauksesi on vahvistettu.</p>" +
	            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(slotTime) + "</p>" +
	            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(slotTime) + "</p>" +
	            "<br></br>" +
	            "<p>Mikäli et pääse saunomaan, voit perua varauksesi vielä vähintään 3 h ennen vuoron alkamista.</p>"

	        console.log("CONFIRMATION: ", JPSM.html)

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Varausvahvistus:' + slotTime.toString() + ' - Hakolahdentie 2',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-error: ", err);
	            } else {
	                console.log("MAIL-SENT: ", body);
	            }
	        });
	    },



	    sendCancellationCount: (sendTo, slotInfo, slotTimeMs) => {
	        if (!JPSM.initialized) return;
	        var day = new Date()
	        day.setTime(slotTimeMs)
	        console.log("sendCancellationCount")
	        console.log(slotTimeMs)

	        JPSM.html =
	            "<h1>Peruutuksen vahvistus</h1>" +
	            "<p>Peruutuksesi on vahvistettu.</p>" +
	            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
	            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
	            "<br></br>" +
	            "<p>Kertavarauksesi on palautettu tilillesi.</p>" +
	            "<p>Tervetuloa saunomaan jonain toisena ajankohtana!</p>"

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Peruutusvahvistus:' + day.toString() + ' - Hakolahdentie 2',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-error: ", err);
	            } else {
	                console.log("CANCEL-SENT: ", body);
	            }
	        });
	    },


	    sendReceipt: (sendTo, trx, trxId) => {
	        if (!JPSM.initialized) return;

	        console.log("sendReceipt")
	        console.log(trx.title)
	        var expires = new Date();
	        expires.setTime(trx.expires);
	        var expiresTxt = trx.expires != 0? "<p> Voimassaolo loppuu: " + JPSM.jps.timeHelper.getDayStr(expires) + "</p>" : ""

	        JPSM.html =
	            "<h1>Kiitos ostostasi!</h1>" +
	            "<p>Voit nyt mennä varaamaan saunavuoroja.</p>" +
	            "<br></br>" +
	            "<h1>Ostokuitti</h1>" +
	            "<br></br>" +
	            "<p>Tuote: " + trx.title + "</p>" +
	            "<p>Tuotekuvaus: " + trx.desc + "</p>" +
	            expiresTxt +
	            "<p>Veroton hinta: " + trx.beforetax + " " + trx.details.transaction.currencyIsoCode + "</p>" +
	            "<p>ALV(" + trx.taxpercent + ")     : " + trx.taxamount + " " + trx.details.transaction.currencyIsoCode + "</p>" +
	            "<p>Yhteensä     : " + trx.price + " " + trx.details.transaction.currencyIsoCode + "</p>" +
	            "<br></br>" +
	            "<p>Ostotunniste: " + trxId + "</p>" +
	            "<p>Maksupalvelutunniste: " + trx.details.transaction.id + "</p>" +
	            "<p>Maksutapa: " + trx.details.transaction.paymentInstrumentType + "</p>" 

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Ostokuitti, Hakolahdentie 2',
	            html: JPSM.html
	        }
	        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
	            if (err) {
	                console.error("MAILGUN-RECEIPT-error: ", err);
	            } else {
	                console.log("RECEIPT-SENT: ", body);
	            }
	        });
	    }


	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	
	module.exports = {


	    completePendingTransaction: (JPS, pendingTransactionKey, externalReference, paymentInstrumentType, paymentMethod) => {

	        var promise = new Promise( (resolve, reject) => {
	//Promise/////////////////////////////////////////////////

	        // Let's get the transaction at hand.
	        JPS.firebase.database().ref('/pendingtransactions/' + pendingTransactionKey).once('value')
	        .then(snapshot => {
	            if(snapshot.val() !== null){
	                JPS.pendingTransaction = snapshot.val()
	                console.log("Processing pending transaction: ", JPS.pendingTransaction)
	                JPS.dataToUpdate = Object.assign(
	                    JPS.pendingTransaction.transaction, 
	                    JPS.pendingTransaction.shopItem, {
	                    details: {
	                        success: true,
	                        transaction: {
	                            pendingTransaction: pendingTransactionKey,
	                            amount: JPS.pendingTransaction.shopItem.price,
	                            currencyIsoCode: "EUR",
	                            id: externalReference,
	                            paymentInstrumentType: paymentInstrumentType,
	                            paymentMethod: paymentMethod
	                        }
	                    }
	                })
	                return JPS.firebase.database().ref('/transactions/'+JPS.pendingTransaction.user+'/'+JPS.pendingTransaction.timestamp)
	                .update(JPS.dataToUpdate)                    
	            }
	            throw( new Error("PendingTransactionHelper: Pending transaction was not found: " + pendingTransactionKey))
	        }).then(() => {
	            console.log("Pending transaction processed succesfully. Removing pending record.");
	            return JPS.firebase.database().ref('/pendingtransactions/'+pendingTransactionKey).remove();
	        }).then(() => {
	            console.log("Pending record removed successfully.");
	            if(JPS.pendingTransaction.shopItem.type === "special"){
	                JPS.firebase.database().ref('/scbookingsbyslot/' + JPS.pendingTransaction.transaction.shopItemKey + '/' + JPS.pendingTransaction.user)
	                .update({transactionReference: JPS.pendingTransaction.timestamp, shopItem: JPS.pendingTransaction.shopItem})
	                .then(() => {
	                    return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.pendingTransaction.user + '/' + JPS.pendingTransaction.transaction.shopItemKey)
	                    .update({transactionReference: JPS.pendingTransaction.timestamp, shopItem: JPS.pendingTransaction.shopItem})
	                }).then(()=>{
	                    console.log("Updated SC-bookings succesfully");
	                    JPS.mailer.sendReceipt(JPS.pendingTransaction.receiptEmail, JPS.dataToUpdate, JPS.pendingTransaction.timestamp);
	                })
	                .catch(error => {
	                    console.error("Processing SC-bookings failed: ", pendingTransactionKey, error);
	                    throw(new Error("Processing SC-bookings failed: " + pendingTransactionKey + error.message))
	                })
	                resolve({code: 200, message: "OK"});                    
	            } else {
	                JPS.mailer.sendReceipt(JPS.pendingTransaction.receiptEmail, JPS.dataToUpdate, JPS.pendingTransaction.timestamp);
	                resolve({code: 200, message: "OK"});                    
	            }                  
	        }).catch(err => {
	            console.error("completePendingTransaction failde: ", err, JPS.pendingTransaction);
	            reject({code: 500, message: "completePendingTransaction failde: " + err, err});
	        });

	//Promise/////////////////////////////////////////////////
	        })
	        return promise;
	    }
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	var JHLP = {}

	module.exports = {
	    getSlotTimeLocal: (weeksForward, timeOfStart, dayNumber) => {

	        JHLP.slotTime = new Date();
	        JHLP.dayNumber = JHLP.slotTime.getDay()
	        JHLP.dayNumber = (JHLP.dayNumber == 0) ? 7 : JHLP.dayNumber;
	        JHLP.daysToAdd = weeksForward * 7 + dayNumber - JHLP.dayNumber;

	        JHLP.slotTime.setHours(0);
	        JHLP.slotTime.setMinutes(0);
	        JHLP.slotTime.setSeconds(0);
	        JHLP.slotTime.setMilliseconds(0);
	        JHLP.slotTime.setTime(JHLP.slotTime.getTime() + JHLP.daysToAdd * 24 * 60 * 60 * 1000 + timeOfStart);

	        return JHLP.slotTime;
	    },
	    getDayStr: (day) => {
	        var month = 1+day.getMonth()
	        return day.getDate() + "." + month + "." + day.getFullYear()
	    },
	    getTimeStr: (day) => {
	        return day.toTimeString()
	    },
	    getUntilEndOfDayMsFromNow: (now) => {
	        JHLP.nowTime = new Date();
	        JHLP.nowTime.setTime(now);
	        JHLP.nowTime.setHours(23);
	        JHLP.nowTime.setMinutes(59);
	        JHLP.nowTime.setSeconds(59);
	        JHLP.nowTime.setMilliseconds(999);
	        return (JHLP.nowTime.getTime() - now)
	    },
	    shiftUntilEndOfDayMs: (now) => {
	        JHLP.nowTime = new Date();
	        JHLP.nowTime.setTime(now);
	        JHLP.nowTime.setHours(23);
	        JHLP.nowTime.setMinutes(59);
	        JHLP.nowTime.setSeconds(59);
	        JHLP.nowTime.setMilliseconds(999);
	        console.log("TIME HELPER - shift time to EOD:", JHLP.nowTime, (now - JHLP.nowTime.getTime()));
	        return JHLP.nowTime.getTime()
	    }

	}

/***/ },
/* 8 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cashbuy, post the item being purchased
	    //######################################################
	    JPS.app.post('/approveincomplete', (req, res) => {

	        JPS.now = Date.now();
	        console.log("approveincomplete requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.pendingTransactionKey = JPS.post.pending_transaction_id;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested approveincomplete for trx: ", JPS.pendingTransactionKey);
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.user = snapshot.val()
	                    JPS.user.key = snapshot.key;
	                    return JPS.firebase.database().ref('/specialUsers/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.specialUser = snapshot.val()
	                    if (JPS.specialUser.admin || JPS.specialUser.instructor) {
	                        console.log("USER requesting approveincomplete is ADMIN or INSTRUCTOR");
	                        JPS.pendingTransactionsHelper.completePendingTransaction(JPS, JPS.pendingTransactionKey, JPS.user.lastname, "Admin", null)
	                        .then( status => {
	                            console.log("Status from completing pending transaction: ", status);
	                            res.status(200).end();
	                        })
	                        .catch((error) => {
	                            console.error("Complete pending transaction request failed: ", error);
	                            throw( new Error("Complete pending transaction request failed: " + error.message))
	                        })
	                    } else{
	                        throw (new Error("Non admin or instructor user requesting cashbuy."))
	                    }
	                }).catch(err => {
	                    console.error("approveincomplete failde: ", err);
	                    res.status(500).jsonp({
	                        message: "approveincomplete failde." + err.toString()
	                    }).end(err);
	                });
	        })
	    })
	}

/***/ },
/* 9 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: 
	    //######################################################
	    JPS.app.post('/cancelpaytrailtransaction', (req, res) => {

	        JPS.now = Date.now();
	        console.log("cancelpaytrailtransaction requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.transactionToCancel = JPS.post.pending_transaction;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested cancelpaytrailtransaction.");
	                    return JPS.firebase.database().ref('/pendingtransactions/' + JPS.transactionToCancel).remove();
	                })
	                .then( () => {
	                    res.status(200).jsonp("Cancel successful.").end();
	                }).catch(err => {
	                    console.error("Cancel Pay Trai transaction failed: ", err);
	                    res.status(500).jsonp({
	                        message: "Cancel Pay Trai transaction failde." + err.toString()
	                    }).end(err);
	                });
	            })
	        })
	}


/***/ },
/* 10 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cashbuy, post the item being purchased
	    //######################################################
	    JPS.app.post('/cashbuy', (req, res) => {

	        JPS.now = Date.now();
	        console.log("Cashbuy requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.forUserId = JPS.post.for_user;
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.shopItemKey = JPS.post.item_key;
	            JPS.itemType = JPS.post.purchase_target;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested cashbuy for user: ", JPS.forUserId);
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.user = snapshot.val()
	                    JPS.user.key = snapshot.key;
	                    return JPS.firebase.database().ref('/specialUsers/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.specialUser = snapshot.val()
	                    if (JPS.specialUser.admin || JPS.specialUser.instructor) {
	                        console.log("USER requesting cashpay is ADMIN or INSTRUCTOR");
	                        return JPS.firebase.database().ref('/users/' + JPS.forUserId).once('value');
	                    }
	                    throw (new Error("Non admin or instructor user requesting cashbuy."))
	                })
	                .then(snapshot => {
	                    JPS.forUser = snapshot.val()
	                    JPS.forUser.key = snapshot.key;
	                    switch (JPS.itemType) {
	                        case "special":
	                            return JPS.firebase.database().ref('/specialSlots/' + JPS.shopItemKey).once('value');
	                        default:
	                            return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
	                    }
	                })
	                .then(snapshot => {
	                    JPS.shopItem = snapshot.val();

	                    JPS.transaction = {
	                            user: JPS.forUser.key,
	                            shopItem: JPS.shopItem,
	                            shopItemKey: JPS.shopItemKey,
	                            error: {
	                                code: 0
	                            },
	                            details: {
	                                success: true,
	                                transaction: {
	                                    id: "myyjä: " + JPS.user.lastname,
	                                    amount: JPS.shopItem.price.toString(),
	                                    paymentInstrumentType: "cash",
	                                    currencyIsoCode: "EUR"
	                                }
	                            }
	                        }
	                        //==================================
	                        // Write the transaction to the database
	                        //==================================
	                        //calculate the expiry moment if type is count

	                    if (JPS.shopItem.type === "count") {
	                        JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
	                        JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
	                        JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
	                            .update(Object.assign(JPS.transaction, JPS.shopItem))
	                            .then(() => {
	                                console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
	                                res.status(200).jsonp(JPS.transaction).end();
	                                JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
	                            }).catch(err => {
	                                throw (new Error(err.message + " " + err.code));
	                            });
	                    }
	                    if (JPS.shopItem.type === "time") {
	                        JPS.lastTimeUserHasValidUseTime = JPS.now;
	                        JPS.firebase.database().ref('/transactions/' + JPS.forUser.key).once('value')
	                            .then(snapshot => {
	                                var one;
	                                var all = snapshot.val();
	                                for (one in all) {
	                                    if (all[one].type === "time") {
	                                        if (all[one].expires > JPS.lastTimeUserHasValidUseTime) {
	                                            JPS.lastTimeUserHasValidUseTime = all[one].expires;
	                                        }
	                                    }
	                                }
	                                JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000));
	                                return JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
	                                    .update(Object.assign(JPS.transaction, JPS.shopItem))
	                            })
	                            .then(() => {
	                                console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
	                                res.status(200).jsonp(JPS.transaction).end();
	                                JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
	                            })
	                            .catch(err => {
	                                console.error(err.message + " " + err.code)
	                                throw (new Error(err.message + " " + err.code));
	                            });
	                    }
	                    if(JPS.shopItem.type === "special"){
	                      console.log("special slot purchase ok....");
	                      JPS.shopItem.expires = 0;
	                      JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
	                          .update(Object.assign(JPS.transaction, JPS.shopItem))
	                          .then(() => {
	                            return JPS.firebase.database().ref('/scbookingsbyslot/' + JPS.shopItemKey + '/' + JPS.forUser.key)
	                            .update({transactionReference: JPS.now})
	                          })
	                          .then(() => {
	                            return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.forUser.key + '/' + JPS.shopItemKey)
	                            .update({transactionReference: JPS.now, shopItem: JPS.shopItem})
	                          })
	                          .then(() => {
	                              console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
	                              res.status(200).jsonp(JPS.transaction).end();
	                              JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
	                          }).catch(err => {
	                              throw (new Error(err.message + " " + err.code));
	                          });
	                    }

	                }).catch(err => {
	                    console.error("Cashpay failde: ", err);
	                    res.status(500).jsonp({
	                        message: "Cashpay failde." + err.toString()
	                    }).end(err);
	                });
	        })
	    })
	}


/***/ },
/* 11 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: checkout, post the item being purchased
	    // This post will read the shop item and find out the token + price associated with it
	    // It then creates payment transaction and inserts the payment data to the firebase
	    // Finally adds to the users entitlement new tokens to use.
	    //######################################################
	    JPS.app.post('/checkout', (req, res) => {

	        JPS.now = Date.now();
	        console.log("Checkout requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.nonceFromTheClient = JPS.post.payment_method_nonce;
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.shopItemKey = JPS.post.item_key;
	            JPS.itemType = JPS.post.purchase_target;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested checkout.");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    if(snapshot.val() != null){
	                        JPS.user = snapshot.val()
	                        JPS.user.key = snapshot.key;
	                        switch(JPS.itemType){
	                        case "special":
	                            return JPS.firebase.database().ref('/specialSlots/' + JPS.shopItemKey).once('value');
	                        default:
	                            return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
	                        }
	                    }
	                    throw( new Error("User was not found in db: " + JPS.currentUserUID) );

	                })
	                .then(snapshot => {
	                    JPS.shopItem = snapshot.val();
	                    //
	                    //=======================================
	                    // Do transaction to Braintree
	                    //=======================================
	                    //
	                    JPS.gateway.transaction.sale({
	                        amount: JPS.shopItem.price,
	                        paymentMethodNonce: JPS.nonceFromTheClient,
	                        options: {
	                            submitForSettlement: true
	                        }
	                    }, (err, result) => {
	                        if (err) {
	                            console.error(err);
	                            throw (new Error("Sale transaction to Braintree failed: " + err.toString()))
	                        } else {
	                            console.log("Braintree transaction succesfully done.");
	                        }

	                        JPS.transaction = {
	                                user: JPS.user.key,
	                                shopItem: JPS.shopItem,
	                                shopItemKey: JPS.shopItemKey,
	                                error: err ? err : {
	                                    code: 0
	                                },
	                                details: result
	                            }
	                            //==================================
	                            // Write the transaction to the database
	                            //==================================
	                            //calculate the expiry moment if type is count
	                        if (JPS.shopItem.type === "count") {
	                            JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
	                            JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
	                            JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.now)
	                                .update(Object.assign(JPS.transaction, JPS.shopItem))
	                                .then(() => {
	                                    console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
	                                    res.status(200).jsonp(JPS.transaction).end();
	                                    JPS.mailer.sendReceipt(JPS.user.email, JPS.transaction, JPS.now); //Send confirmation email
	                                }).catch(err => {
	                                    throw (new Error(err.message + " " + err.code));
	                                });
	                        }
	                        if (JPS.shopItem.type === "time") {
	                            JPS.lastTimeUserHasValidUseTime = JPS.now;
	                            JPS.firebase.database().ref('/transactions/' + JPS.user.key).once('value')
	                                .then(snapshot => {
	                                    var one;
	                                    var all = snapshot.val();
	                                    for (one in all) {
	                                        if (all[one].type === "time") {
	                                            if (all[one].expires > JPS.lastTimeUserHasValidUseTime) {
	                                                JPS.lastTimeUserHasValidUseTime = all[one].expires;
	                                            }
	                                        }
	                                    }
	                                    JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000));
	                                    return JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.now)
	                                        .update(Object.assign(JPS.transaction, JPS.shopItem))
	                                })
	                                .then(() => {
	                                    console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
	                                    res.status(200).jsonp(JPS.transaction).end();
	                                    JPS.mailer.sendReceipt(JPS.user.email, JPS.transaction, JPS.now); //Send confirmation email
	                                })
	                                .catch(err => {
	                                    console.error(err.message + " " + err.code)
	                                    throw (new Error(err.message + " " + err.code));
	                                });
	                        }
	                        if(JPS.shopItem.type === "special"){
	                          console.log("special slot purchase....");
	                          JPS.shopItem.expires = 0;
	                          JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.now)
	                              .update(Object.assign(JPS.transaction, JPS.shopItem))
	                              .then(() => {
	                                return JPS.firebase.database().ref('/scbookingsbyslot/' + JPS.shopItemKey + '/' + JPS.user.key)
	                                .update({transactionReference: JPS.now})
	                              })
	                              .then(() => {
	                                return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.forUser.key + '/' + JPS.shopItemKey)
	                                .update({transactionReference: JPS.now, shopItem: JPS.shopItem})
	                              })
	                              .then(() => {
	                                  console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
	                                  res.status(200).jsonp(JPS.transaction).end();
	                                  JPS.mailer.sendReceipt(JPS.user.email, JPS.transaction, JPS.now); //Send confirmation email
	                              }).catch(err => {
	                                  throw (new Error(err.message + " " + err.code));
	                              });
	                        }

	                    })
	                }).catch(err => {
	                    console.error("Checkout failde: ", err);
	                    res.status(500).jsonp({
	                        message: "Checkout failde."
	                    }).end(err);
	                });
	        })
	    })
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	
	var md5 = __webpack_require__ (2)

	exports.setApp = function (JPS){

	//######################################################
	// GET: clienttoken, needed for the client to initiate payment method
	//######################################################

	  JPS.app.post('/completepaytrail', (req, res) => {
	    
	    
	    JPS.now = Date.now();
	    console.log("completepaytrail requested.", JPS.now);
	    JPS.body = '';
	    req.on('data', (data) => {
	        JPS.body += data;
	        // Too much POST data, kill the connection!
	        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	        if (JPS.body.length > 1e6) req.connection.destroy();
	    });
	    req.on('end', () => {
	        JPS.post = JSON.parse(JPS.body);
	        JPS.currentUserToken = JPS.post.current_user;
	        console.log("POST:", JPS.post);
	        JPS.merchantAuthenticationhash = "6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ"
	        console.log("ORDER_NUMBER", JPS.post.ORDER_NUMBER);
	        console.log("TIMESTAMP", JPS.post.TIMESTAMP);
	        console.log("PAID", JPS.post.PAID);
	        console.log("METHOD", JPS.post.METHOD);
	        console.log("RETURN_AUTHCODE", JPS.post.RETURN_AUTHCODE);
	        JPS.hashOK = md5(JPS.post.ORDER_NUMBER + '|' + JPS.post.TIMESTAMP + '|' + JPS.post.PAID + '|' + JPS.post.METHOD + '|' + JPS.merchantAuthenticationhash).toUpperCase()
	        JPS.hashNOK = md5(JPS.post.ORDER_NUMBER + '|' + JPS.post.TIMESTAMP + '|' + JPS.merchantAuthenticationhash).toUpperCase()
	        console.log("HASH-OK", JPS.hashOK);
	        console.log("HASH-NOK", JPS.hashNOK);
	        JPS.orderNumber = JPS.post.ORDER_NUMBER;
	        JPS.timeStamp = JPS.post.TIMESTAMP;
	        JPS.paymentTransactionRef = JPS.post.PAID;
	        JPS.paymentMethod = JPS.post.METHOD
	        JPS.authorizationCode = JPS.post.RETURN_AUTHCODE;

	        JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	        .then(decodedToken => {
	            JPS.currentUserUID = decodedToken.sub;
	            console.log("User: ", JPS.currentUserUID, " requested completepaytrail.");
	            return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	        })
	        .then(snapshot => {
	            if(snapshot.val() != null){
	              JPS.user = snapshot.val()
	              JPS.user.key = snapshot.key;
	              if(JPS.post.PAID){
	                console.log("Transaction was paid OK");
	                if(JPS.hashOK === JPS.post.RETURN_AUTHCODE){
	                  console.log("Authorization code matches!!", JPS.hashOK);
	                  console.log("start processing: ", JPS.orderNumber);

	                  JPS.pendingTransactionsHelper.completePendingTransaction(JPS, JPS.orderNumber, JPS.paymentTransactionRef, "PayTrail", JPS.paymentMethod)
	                  .then( status => {
	                      console.log("Status from completing pending transaction: ", status);
	                      res.status(200).end();
	                  })
	                  .catch((error) => {
	                      console.error("Complete pending transaction request failed: ", error);
	                      throw( new Error("Complete pending transaction request failed: " + error.message))
	                  })

	                } else {
	                  console.error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK);
	                  throw (new Error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK))
	                }
	              }
	              else{
	                console.log("Payment did not clear or was cancelled. Remove the pending transaction: ", JPS.orderNumber);
	                JPS.firebase.database().ref('/pendingtransactions/'+JPS.orderNumber).remove()
	                .then(() => {
	                  console.log("Pending transaction for NOK payment removed: ", JPS.orderNumber);
	                  res.status(200).end();
	                })
	                .catch(error => {
	                  console.error("Removing pending transaction failed.");
	                  throw (new Error("Removing pending transaction failed." + error.message))
	                })
	              }
	            } else{
	              throw( new Error("User was not found in db: " + JPS.currentUserUID) );
	            }

	        })
	        .catch(err => {
	            console.error("Complete Pay Trai transaction failed: ", err);
	            res.status(500).jsonp({
	                message: "Complete Pay Trai transaction failde." + err
	            }).end(err);
	        })
	    })
	  })
	}


/***/ },
/* 13 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cashbuy, post the item being purchased
	    //######################################################
	    JPS.app.post('/feedback', (req, res) => {

	        JPS.now = Date.now();
	        console.log("Feedback requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.feedbackMessage = JPS.post.feedback_message;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested feedback.");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.user = snapshot.val()
	                    JPS.mailer.sendFeedback(JPS.user, JPS.feedbackMessage)
	                    JPS.mailer.sendThankyouForFeedback(JPS.user)
	                    res.status(200).jsonp("Feedback sent ok.").end()
	                }).catch(err => {
	                    console.error("Feedback failde: ", err);
	                    res.status(500).jsonp({
	                        message: "Feedback failde." + err.toString()
	                    }).end(err);
	                });
	        })
	    })
	}


/***/ },
/* 14 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: 
	    //######################################################
	    JPS.app.post('/initializedelayedtransaction', (req, res) => {

	        JPS.now = Date.now();
	        console.log("initializedelayedtransaction requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.shopItemKey = JPS.post.item_key;
	            JPS.itemType = JPS.post.purchase_target;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested initializedelayedtransaction.");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    if(snapshot.val() != null){
	                        JPS.user = snapshot.val()
	                        JPS.user.key = snapshot.key;
	                        switch(JPS.itemType){
	                        case "special":
	                            return JPS.firebase.database().ref('/specialSlots/' + JPS.shopItemKey).once('value');
	                        default:
	                            return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
	                        }
	                    } else {
	                        throw(new Error("User was not found in the database: ", JPS.currentUserUID))
	                    }

	                })
	                .then(snapshot => {
	                    JPS.shopItem = snapshot.val();
	                    console.log("shopitem: ",JPS.shopItem );
	                    JPS.transaction = {
	                            user: JPS.user.key,
	                            shopItem: JPS.shopItem,
	                            shopItemKey: JPS.shopItemKey,
	                            error: { code: 0 },
	                            details: "pending"
	                        }
	                        //==================================
	                        // Write the transaction to the database
	                        //==================================
	                        //calculate the expiry moment if type is count
	                    if (JPS.shopItem.type === "count") {
	                        JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
	                        JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
	                        JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
	                                transaction: JPS.transaction,
	                                shopItem: JPS.shopItem,
	                                user: JPS.user.key,
	                                receiptEmail: JPS.user.email,
	                                timestamp: JPS.now
	                            },err => {
	                                if(err){
	                                    console.error("COUNT push failed: ", err)
	                                    throw (new Error("COUNT push failed" + err.message + " " + err.code));
	                                } else {
	                                    console.log("Pending count transaction saved: ", JPS.ref.key);
	                                    res.status(200).jsonp(JPS.ref.key).end();
	                                }
	                            });
	                    }
	                    if (JPS.shopItem.type === "time") {
	                        console.log("time item process started.");
	                        JPS.lastTimeUserHasValidUseTime = JPS.now;
	                        JPS.firebase.database().ref('/transactions/' + JPS.user.key).once('value')
	                            .then(snapshot => {
	                                if(snapshot.val() != null){ //User has previous transactions - find the latest expiry
	                                    console.log("Porcessing users previous transactions to find latest expiry.");
	                                    var one;
	                                    var all = snapshot.val();
	                                    for (one in all) {
	                                        if (all[one].type === "time") {
	                                            if (all[one].expires > JPS.lastTimeUserHasValidUseTime) {
	                                                JPS.lastTimeUserHasValidUseTime = all[one].expires;
	                                                console.log("Found later expiry than now: ", JPS.lastTimeUserHasValidUseTime);
	                                            }
	                                        }
	                                    }
	                                }
	                                JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000));
	                                console.log("This new time expires: ", JPS.shopItem.expires);
	                                JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
	                                    transaction: JPS.transaction,
	                                    shopItem: JPS.shopItem,
	                                    receiptEmail: JPS.user.email,
	                                    user: JPS.user.key,
	                                    timestamp: JPS.now
	                                }, err => {
	                                    if(err){
	                                        console.error("TIME push failed", err)
	                                        throw (new Error("TIME push failed" + err.message + " " + err.code));                                        
	                                    } else {
	                                        console.log("Pending time transaction saved: ",JPS.ref.key);
	                                        res.status(200).jsonp(JPS.ref.key).end();
	                                    }
	                                })
	                            }, err => {
	                                console.error(err.message + " " + err.code)
	                                throw (new Error(err.message + " " + err.code));
	                            });
	                    }
	                    if(JPS.shopItem.type === "special"){
	                        console.log("special slot purchase....");
	                        JPS.shopItem.expires = 0;
	                        JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
	                            transaction: JPS.transaction,
	                            shopItem: JPS.shopItem,
	                            user: JPS.user.key,
	                            receiptEmail: JPS.user.email,
	                            timestamp: JPS.now
	                        }, err => {
	                            if(err){
	                                console.error(err.message + " " + err.code)
	                                throw (new Error(err.message + " " + err.code));                                        
	                            } else {
	                                console.log("Pending special transaction saved: ",JPS.ref.key);
	                                res.status(200).jsonp(JPS.ref.key).end();
	                            }
	                        })
	                    }

	                    }).catch(err => {
	                    console.error("Initialize delayed transaction failed: ", err);
	                    res.status(500).jsonp({
	                        message: "Initialize delayed transaction failde." + err.toString()
	                    }).end(err);
	                });
	            })
	        })
	}


/***/ },
/* 15 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: 
	    //######################################################
	    JPS.app.post('/initializepaytrailtransaction', (req, res) => {

	        JPS.now = Date.now();
	        console.log("initializepaytrailtransaction requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.shopItemKey = JPS.post.item_key;
	            JPS.itemType = JPS.post.purchase_target;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested initializepaytrailtransaction.");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    if(snapshot.val() != null){
	                        JPS.user = snapshot.val()
	                        JPS.user.key = snapshot.key;
	                        switch(JPS.itemType){
	                        case "special":
	                            return JPS.firebase.database().ref('/specialSlots/' + JPS.shopItemKey).once('value');
	                        default:
	                            return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
	                        }
	                    } else {
	                        throw(new Error("User was not found in the database: ", JPS.currentUserUID))
	                    }

	                })
	                .then(snapshot => {
	                    JPS.shopItem = snapshot.val();
	                    console.log("shopitem: ",JPS.shopItem );
	                    JPS.transaction = {
	                            user: JPS.user.key,
	                            shopItem: JPS.shopItem,
	                            shopItemKey: JPS.shopItemKey,
	                            error: { code: 0 },
	                            details: "pending"
	                        }
	                        //==================================
	                        // Write the transaction to the database
	                        //==================================
	                        //calculate the expiry moment if type is count
	                    if (JPS.shopItem.type === "count") {
	                        JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000));
	                        JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
	                        JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
	                                transaction: JPS.transaction,
	                                shopItem: JPS.shopItem,
	                                user: JPS.user.key,
	                                receiptEmail: JPS.user.email,
	                                timestamp: JPS.now
	                            },err => {
	                                if(err){
	                                    console.error("COUNT push failed: ", err)
	                                    throw (new Error("COUNT push failed" + err.message + " " + err.code));
	                                } else {
	                                    console.log("Pending count transaction saved: ", JPS.ref.key);
	                                    res.status(200).jsonp(JPS.ref.key).end();
	                                }
	                            });
	                    }
	                    if (JPS.shopItem.type === "time") {
	                        console.log("time item process started.");
	                        JPS.lastTimeUserHasValidUseTime = JPS.now;
	                        JPS.firebase.database().ref('/transactions/' + JPS.user.key).once('value')
	                            .then(snapshot => {
	                                if(snapshot.val() != null){ //User has previous transactions - find the latest expiry
	                                    console.log("Porcessing users previous transactions to find latest expiry.");
	                                    var one;
	                                    var all = snapshot.val();
	                                    for (one in all) {
	                                        if (all[one].type === "time") {
	                                            if (all[one].expires > JPS.lastTimeUserHasValidUseTime) {
	                                                JPS.lastTimeUserHasValidUseTime = all[one].expires;
	                                                console.log("Found later expiry than now: ", JPS.lastTimeUserHasValidUseTime);
	                                            }
	                                        }
	                                    }
	                                }
	                                JPS.shopItem.expires = JPS.timeHelper.shiftUntilEndOfDayMs(JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000));
	                                console.log("This new time expires: ", JPS.shopItem.expires);
	                                JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
	                                    transaction: JPS.transaction,
	                                    shopItem: JPS.shopItem,
	                                    receiptEmail: JPS.user.email,
	                                    user: JPS.user.key,
	                                    timestamp: JPS.now
	                                }, err => {
	                                    if(err){
	                                        console.error("TIME push failed", err)
	                                        throw (new Error("TIME push failed" + err.message + " " + err.code));                                        
	                                    } else {
	                                        console.log("Pending time transaction saved: ",JPS.ref.key);
	                                        res.status(200).jsonp(JPS.ref.key).end();
	                                    }
	                                })
	                            }, err => {
	                                console.error(err.message + " " + err.code)
	                                throw (new Error(err.message + " " + err.code));
	                            });
	                    }
	                    if(JPS.shopItem.type === "special"){
	                        console.log("special slot purchase....");
	                        JPS.shopItem.expires = 0;
	                        JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
	                            transaction: JPS.transaction,
	                            shopItem: JPS.shopItem,
	                            user: JPS.user.key,
	                            receiptEmail: JPS.user.email,
	                            timestamp: JPS.now
	                        }, err => {
	                            if(err){
	                                console.error(err.message + " " + err.code)
	                                throw (new Error(err.message + " " + err.code));                                        
	                            } else {
	                                console.log("Pending special transaction saved: ",JPS.ref.key);
	                                res.status(200).jsonp(JPS.ref.key).end();
	                            }
	                        })
	                    }

	                    }).catch(err => {
	                    console.error("Initialize Pay Trai transaction failed: ", err);
	                    res.status(500).jsonp({
	                        message: "Initialize Pay Trai transaction failde." + err.toString()
	                    }).end(err);
	                });
	            })
	        })
	}


/***/ },
/* 16 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cashbuy, post the item being purchased
	    //######################################################
	    JPS.app.post('/notifydelayed', (req, res) => {

	        JPS.now = Date.now();
	        console.log("notifydelayed requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.transaction = JPS.post.transaction;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested notifydelayed");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.user = snapshot.val()
	                    JPS.mailer.sendNotifyDelayed(JPS.user, JPS.transaction)
	                    res.status(200).jsonp("Notify sent ok.").end()
	                }).catch(err => {
	                    console.error("Notify failde: ", err);
	                    res.status(500).jsonp( "Feedback failde." + String(err) ).end();
	                });
	        })
	    })
	}


/***/ },
/* 17 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cashbuy, post the item being purchased
	    //######################################################
	    JPS.app.post('/notifyRegistration', (req, res) => {

	        JPS.now = Date.now();
	        console.log("notifyRegistration requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested notifyRegistration.");
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.user = snapshot.val()
	                    JPS.mailer.sendRegistration(JPS.user)
	                    res.status(200).jsonp("Notification sent ok.").end()
	                }).catch(err => {
	                    console.error("Notification failde: ", err);
	                    res.status(500).jsonp("Notification failde." + String(err)).end();
	                });
	        })
	    })
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	
	var md5 = __webpack_require__ (2)

	exports.setApp = function (JPS){

	    //######################################################
	    // POST: 
	    //######################################################
	    JPS.app.post('/paytrailauthcode', (req, res) => {

	        JPS.now = Date.now();
	        console.log("paytrailauthcode requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.trxDetails = JPS.post.auth_code;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested paytrailauthcode.");
	                    JPS.merchantAuthenticationhash = "6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ" //TODO: get this from ENV
	                    console.log("trxDetails", JPS.trxDetails);
	                    JPS.hashOK = md5(JPS.merchantAuthenticationhash + '|' + JPS.trxDetails).toUpperCase()
	                    console.log("HASH-OK", JPS.hashOK);
	                    res.status(200).end(JPS.hashOK);
	                }).catch(err => {
	                    console.error("paytrailauthcode failed: ", err);
	                    res.status(500).jsonp({
	                        message: "paytrailauthcode failed." + err.toString()
	                    }).end(err);
	                });
	            })
	        })
	}


/***/ },
/* 19 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: cashbuy, post the item being purchased
	    //######################################################
	    JPS.app.post('/removeTransaction', (req, res) => {

	        JPS.now = Date.now();
	        console.log("removeTransaction requested.", JPS.now);
	        JPS.body = '';
	        req.on('data', (data) => {
	            JPS.body += data;
	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (JPS.body.length > 1e6) req.connection.destroy();
	        });
	        req.on('end', () => {
	            JPS.post = JSON.parse(JPS.body);
	            JPS.currentUserToken = JPS.post.current_user;
	            JPS.forUserId = JPS.post.for_user;
	            JPS.transactionToRemove = JPS.post.transaction;
	            console.log("POST:", JPS.post);

	            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	                .then(decodedToken => {
	                    JPS.currentUserUID = decodedToken.sub;
	                    console.log("User: ", JPS.currentUserUID, " requested removeTransaction: ", JPS.forUserId + "/" + JPS.transactionToRemove.purchasetime);
	                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.user = snapshot.val()
	                    JPS.user.key = snapshot.key;
	                    return JPS.firebase.database().ref('/specialUsers/' + JPS.currentUserUID).once('value');
	                })
	                .then(snapshot => {
	                    JPS.specialUser = snapshot.val()
	                    if (JPS.specialUser.admin) {
	                        console.log("USER requesting cashpay is ADMIN");
	                        return JPS.firebase.database().ref('/transactions/' + JPS.forUserId + "/" + JPS.transactionToRemove.purchasetime).remove();
	                    }
	                    throw (new Error("Non admin or instructor user requesting cashbuy."))
	                })
	                .then(() => {
	                    if(JPS.transactionToRemove.type === 'special'){
	                        console.log("SPECIAL slot transation - remove bookings: ", JPS.transactionToRemove.shopItemKey, JPS.forUserId);
	                        JPS.firebase.database().ref('/scbookingsbyslot/' + JPS.transactionToRemove.shopItemKey + "/" + JPS.forUserId).remove();
	                        JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.forUserId + "/" + JPS.transactionToRemove.shopItemKey).remove();
	                    }
	                    res.status(200).jsonp("Transaction removed succesfully.").end();
	                }).catch(err => {
	                    console.error("removeTransaction failde: ", err);
	                    res.status(500).jsonp("removeTransaction failde." + String(err)).end();
	                });
	        })
	    })
	}


/***/ },
/* 20 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){

	  //######################################################
	  // POST: reserveSlot
	  // Reduces from the user needed tokens and assigns the user to the slot.
	  //######################################################

	  JPS.app.post('/reserveSlot', (req, res) => {
	    JPS.now = Date.now();
	    console.log("POST: reserveslot", JPS.now);
	    JPS.body = '';
	    req.on('data', (data) => {
	      JPS.body += data;
	      // Too much POST data, kill the connection!
	      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	      if (JPS.body.length > 1e6) req.connection.destroy();
	    });

	    req.on('end', () => {
	      JPS.post = JSON.parse(JPS.body);
	      console.log("POST:", JPS.post);
	      JPS.currentUserToken = JPS.post.user;
	      JPS.slotInfo = JPS.post.slotInfo;
	      JPS.weeksForward = JPS.post.weeksForward;
	      JPS.timezoneOffset = JPS.post.timezoneOffset;
	      JPS.slotTime = JPS.timeHelper.getSlotTimeLocal(JPS.weeksForward, JPS.slotInfo.start, JPS.slotInfo.day)

	      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	      .then( decodedToken => {
	        JPS.currentUserUID = decodedToken.sub;
	        console.log("User: ", JPS.currentUserUID, " requested reserveSlot.");
	        return JPS.firebase.database().ref('/users/'+JPS.currentUserUID).once('value')
	      })
	      .then ( snapshot => {
	        if(snapshot.val() == null){
	          throw(new Error("User record does not exist in the database: " + JPS.currentUserUID))
	        }
	        JPS.user = snapshot.val();
	        JPS.user.key = snapshot.key;
	        console.log("USER:",JPS.user);
	        console.log("slotINFO:",JPS.slotInfo);
	        JPS.userHasCount = false;
	        JPS.earliestToExpire = 0;
	        JPS.expiryTime = 9999999999999;
	        JPS.recordToUpdate = {};
	        JPS.unusedtimes = 0;
	        console.log("Starting to process user transactions");
	        return JPS.firebase.database().ref('/transactions/'+JPS.currentUserUID).once('value')
	      })
	      .then( snapshot => {
	        JPS.allTx = snapshot.val();
	        for (JPS.one in JPS.allTx){
	          if((JPS.allTx[JPS.one].expires > JPS.now) && (JPS.allTx[JPS.one].unusedtimes > 0)){
	            JPS.userHasCount = true;
	                //Find the earliest to expire record
	            if(JPS.allTx[JPS.one].expires < JPS.expiryTime){
	              JPS.earliestToExpire = JPS.one;
	              JPS.expiryTime = JPS.allTx[JPS.one].expires;
	              JPS.recordToUpdate = JPS.allTx[JPS.one];
	              JPS.unusedtimes = JPS.allTx[JPS.one].unusedtimes;
	            }
	          }
	        } // for - looping through transactions
	        JPS.transactionReference = 0; //Leave it 0 if bookign is based on time-token.
	        if(!JPS.userHasCount){
	          console.log("User does not have count");
	          throw( new Error("User is not entitled to book this slot"));
	        }
	        else { //Process user has count option
	          JPS.transactionReference = JPS.earliestToExpire;
	          //TODO: Check tahat user has not already booked in to the slot before reducing count.
	          JPS.recordToUpdate.unusedtimes = JPS.recordToUpdate.unusedtimes - 1;
	          JPS.unusedtimes = JPS.unusedtimes - 1;
	          JPS.firebase.database()
	            .ref('/transactions/'+JPS.currentUserUID+'/'+JPS.earliestToExpire)
	            .update({unusedtimes: JPS.unusedtimes})
	            .then( err => {
	              if(err){
	                throw(new Error(err.message + " " + err.code));
	              } else {
	                console.log("Updated transaction date for user: ", JPS.currentUserUID);
	              }
	            })
	            .catch(err => {throw(err)})
	          }
	          //If user is entitled, write the bookings in to the database
	          if(JPS.userHasTime || JPS.userHasCount){
	            JPS.bookingTime = JPS.slotTime.getTime();
	            JPS.firebase.database().ref('/bookingsbyslot/'+JPS.slotInfo.key+'/'+JPS.bookingTime+'/'+JPS.user.key)
	            .update({
	              user: (JPS.user.alias)? JPS.user.alias : JPS.user.firstname + " " + JPS.user.lastname,
	              transactionReference: JPS.transactionReference,
	              slotTime: JPS.bookingTime
	            })
	            .then( err => {
	              if(err){
	                console.error("Booking by SLOT write to firabase failed: ", err);
	                throw(new Error("Booking by SLOT write to firabase failed: " + err.toString()))
	              }
	              return JPS.firebase.database().ref('/bookingsbyuser/'+JPS.user.key+'/'+JPS.slotInfo.key+'/'+JPS.bookingTime)
	              .update({
	                transactionReference: JPS.transactionReference,
	                slotTime: JPS.bookingTime
	              })
	            })
	            .then( err => {
	              if(err){
	                console.error("Booking by USER write to firabase failed: ", err);
	                throw(new Error("Booking by USER write to firabase failed: " + err.toString()))
	              }
	              else{
	                //======================================
	                res.status(200).jsonp("Booking done succesfully").end();
	                JPS.mailer.sendConfirmation(JPS.user.email, JPS.slotInfo, JPS.slotTime); //Send confirmation email
	                //======================================
	              }
	            })
	            .catch( err => {
	              throw(err)
	            })
	          }
	      })
	      .catch( err => {
	        console.error("Reserve slot failed: ", err);
	        res.status(500).jsonp("Reserve slot failed" + String(err)).end();
	      })
	    })
	  })
	}


/***/ },
/* 21 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){

	  //#############################
	  // Add headers
	  //#############################
	  JPS.app.use( (req, res, next) => {
	      // Website you wish to allow to connect
	      res.setHeader('Access-Control-Allow-Origin', '*');
	      res.setHeader('content-type', 'text/plain')
	      // Request methods you wish to allow
	      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	      res.setHeader('Access-Control-Allow-Headers', 'content-type')
	      // Pass to next layer of middleware
	      next();
	  });

	}


/***/ },
/* 22 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){

	  //######################################################
	  // POST: reserveSlot
	  // Reduces from the user needed tokens and assigns the user to the slot.
	  // Caller must check that the user is entitled to the reservation.
	  //######################################################

	  JPS.app.post('/test', (req, res) => {
	    JPS.now = Date.now();
	    console.log("POST: test", JPS.now);
	    JPS.body = '';
	    req.on('data', (data) => {
	      JPS.body += data;
	      // Too much POST data, kill the connection!
	      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	      if (JPS.body.length > 1e6) req.connection.destroy();
	    });

	    req.on('end', () => {
	      JPS.post = JSON.parse(JPS.body);
	      console.log("POST:", JPS.post);
	      JPS.currentUserToken = JPS.post.current_user;
	      JPS.testCase = JPS.post.test_case;

	      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	      .then( decodedToken => {
	        JPS.currentUserUID = decodedToken.sub;
	        console.log("User: ", JPS.currentUserUID, " requested test - case: ", JPS.testCase);
	        JPS.tests.executeTestCase(JPS, JPS.testCase)
	        .then(() => {res.status(200).end();})
	        .catch(error => {res.status(500).jsonp(error.toString()).end(error);})
	      })
	      .catch( err => {
	        console.error("Test failed: ", err);
	        res.status(500).jsonp({context: "Test failed", err}).end(err);
	      })
	    })
	  })
	}


/***/ },
/* 23 */
/***/ function(module, exports) {

	
	module.exports = {

	    executeTestCase: (JPS, testCase) => {
	        var promise = new Promise( (resolve, reject) => {
	            switch(testCase){
	            case "firebase_error_log":
	                JPS.tests.testFirebaseLogging(JPS)
	                .then(() => {resolve()})
	                .catch(error => {
	                    reject(error)})
	                break;
	            default:
	                console.error("Test case was not known");
	                reject("Unknown test case: " + testCase)
	            }
	        })
	        return promise;
	    },

	    testFirebaseLogging: (JPS) => {
	        var promise = new Promise( (resolve, reject) => {
	            try{
	                console.log("Test case: testFirebaseLogging");
	                JPS.errorHelper.logErrorToFirebase(JPS,{
	                    error: "testivirhe",
	                    details: "jotain meni tosi pieleen",
	                    context: {
	                        id: 56,
	                        runner: "iskari"
	                    }
	                })
	            } 
	            catch(e){
	                console.error("Test case: testFirebaseLogging failed:", e);
	                reject(e);
	            }
	            console.log("Test case: testFirebaseLogging passed");
	            resolve();
	        })
	        return promise;
	    }
	}

/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = require("braintree");

/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 26 */
/***/ function(module, exports) {

	module.exports = require("firebase");

/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = require("mailgun-js");

/***/ }
/******/ ]);