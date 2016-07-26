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
/******/ 	__webpack_require__.p = "/home/tsa/repo/joogaserver/public/";

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

	var express = __webpack_require__(10)
	var JPS = {} //The global.
	JPS.timeHelper = __webpack_require__(8)
	JPS.mailer = __webpack_require__(2)
	JPS.braintree = __webpack_require__(9);

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
	JPS.firebase = __webpack_require__(11)
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
	__webpack_require__(7).setApp(JPS);

	// Get client token
	__webpack_require__(1).setApp(JPS);

	// POST checkout
	__webpack_require__(5).setApp(JPS);

	// POST checkout
	__webpack_require__(4).setApp(JPS);

	// POST reserve slot
	__webpack_require__(6).setApp(JPS);

	// POST reserve slot
	__webpack_require__(3).setApp(JPS);
	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 1 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){
	//######################################################
	// GET: clienttoken, needed for the client to initiate payment method
	//######################################################
	JPS.app.get('/clientToken', (req, res) => {
	  console.log("ClientToken requested");
	  JPS.firebase.auth().verifyIdToken(req.query.token)
	  .then( decodedToken => {
	    var uid = decodedToken.sub;
	    console.log("User: ", uid, " requested client token.");
	    JPS.gateway.clientToken.generate({}, (err, response) => {
	      if (err) {
	        console.error("Client token generation failed:", err);
	        throw(new Error("Token request to braintree gateway failed: err=" + err.toString()))
	      }
	      else {
	        console.log("Sending client token: ", response.clientToken);
	        res.status(200).end(response.clientToken);
	      }
	    })
	  })
	  .catch( err => {
	    console.error("Get client token failed: ", err);
	    res.status(500).jsonp({message: "Get client token failed."}).end(err);
	  });
	})
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var JPSM = {}
	JPSM.Mailgun = __webpack_require__(12)
	JPSM.mg_api_key = process.env.MAILGUN_API_KEY || 'key-4230707292ae718f00a8274d41beb7f3';
	JPSM.mg_domain = 'sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
	JPSM.mg_from_who = 'postmaster@sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
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

	    sendConfirmation: (sendTo, courseInfo, courseTime) => {
	        if (!JPSM.initialized) return;

	        console.log("sendConfirmation")
	        console.log(sendTo)
	        console.log(courseInfo)
	        console.log(courseTime)

	        JPSM.html =
	            "<h1>Varauksen vahvistus</h1>" +
	            "<p>Varauksesi kurssille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
	            "<p>Kurssipäivä: " + JPSM.jps.timeHelper.getDayStr(courseTime) + "</p>" +
	            "<p>Kurssiaika: " + JPSM.jps.timeHelper.getTimeStr(courseTime) + "</p>" +
	            "<br></br>" +
	            "<p>Mikäli et pääse osallistumaan kurssille voit perua ilmoittautumisesi vielä edellisenä päivänä.</p>" +
	            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

	        console.log("CONFIRMATION: ", JPSM.html)

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Varausvahvistus:' + courseTime.toString() + ' - Joogakoulu Silta',
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

	    sendCancellationCount: (sendTo, courseInfo, courseTimeMs) => {
	        if (!JPSM.initialized) return;
	        var day = new Date()
	        day.setTime(courseTimeMs)
	        console.log("sendCancellationCount")
	        console.log(courseTimeMs)

	        JPSM.html =
	            "<h1>Peruutuksen vahvistus</h1>" +
	            "<p>Peruutuksesi kurssille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
	            "<p>Kurssipäivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
	            "<p>Kurssiaika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
	            "<br></br>" +
	            "<p>Kertalippusi on palautettu tilillesi.</p>" +
	            "<p>Terve tuloa jonain toisena ajankohtana.</p>" +
	            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Peruutusvahvistus:' + day.toString() + ' - Joogakoulu Silta',
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

	    sendCancellationTime: (sendTo, courseInfo, courseTimeMs) => {
	        if (!JPSM.initialized) return;
	        var day = new Date()
	        day.setTime(courseTimeMs)
	        console.log("sendCancellationTime")
	        console.log(courseTimeMs)

	        JPSM.html =
	            "<h1>Peruutuksen vahvistus</h1>" +
	            "<p>Peruutuksesi kurssille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
	            "<p>Kurssipäivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
	            "<p>Kurssiaika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
	            "<br></br>" +
	            "<p>Terve tuloa jonain toisena ajankohtana.</p>" +
	            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Peruutusvahvistus:' + day.toString() + ' - Joogakoulu Silta',
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

	        JPSM.html =
	            "<h1>Ostokuitti</h1>" +
	            "<br></br>" +
	            "<p>Tuote: " + trx.title + "</p>" +
	            "<p>Tuotekuvaus: " + trx.desc + "</p>" +
	            "<p>Voimassaolo loppuu: " + JPSM.jps.timeHelper.getDayStr(expires) + "</p>" +
	            "<p>Veroton hinta: " + trx.beforetax + " " + trx.details.transaction.currencyIsoCode + "</p>" +
	            "<p>ALV(" + trx.taxpercent + ")     : " + trx.taxamount + " " + trx.details.transaction.currencyIsoCode + "</p>" +
	            "<p>Yhteensä     : " + trx.price + " " + trx.details.transaction.currencyIsoCode + "</p>" +
	            "<br></br>" +
	            "<p>Ostotunniste: " + trxId + "</p>" +
	            "<p>Maksupalvelutunniste: " + trx.details.transaction.id + "</p>" +
	            "<p>Maksutapa: " + trx.details.transaction.paymentInstrumentType + "</p>" +
	            "<br></br>" +
	            "<p>Y-tunnus: Y-32487984</p>" +
	            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

	        JPSM.data = {
	            from: JPSM.mg_from_who,
	            to: sendTo,
	            subject: 'Ostokuitti, Joogakoulu Silta',
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
/* 3 */
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
	            JPS.courseInfo = JPS.post.courseInfo;
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
	                        return JPS.firebase.database().ref('/bookingsbycourse/' + JPS.courseInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key).once('value');
	                    } else {
	                        throw (new Error("User record does not exist in the database: " + JPS.currentUserUID))
	                    }
	                })
	                .then(snapshot => {
	                    if (snapshot.val() == null) {
	                        throw (new Error("Booking by-COURSE does not exist in the database."))
	                    }
	                    return JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' + JPS.courseInfo.key + '/' + JPS.cancelItem).once('value');
	                })
	                .then(snapshot => {
	                    if (snapshot.val() == null) {
	                        throw (new Error("Booking by-USER does not exist in the database."))
	                    }
	                    return JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' + JPS.courseInfo.key + '/' + JPS.cancelItem).remove();
	                })
	                .then(() => {
	                    return JPS.firebase.database().ref('/bookingsbycourse/' + JPS.courseInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key).remove();
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
	                                JPS.mailer.sendCancellationCount(JPS.user.email, JPS.courseInfo, JPS.cancelItem); //Send confirmation email
	                            }).catch(err => {
	                                throw (new Error(err.message + " " + err.code));
	                            })
	                    } else {
	                        res.status(200).jsonp({
	                            message: "Cancellation TIME was succesfull."
	                        }).end();
	                        JPS.mailer.sendCancellationTime(JPS.user.email, JPS.courseInfo, JPS.cancelItem); //Send confirmation email
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
/* 4 */
/***/ function(module, exports) {

	exports.setApp = function(JPS) {

	    //######################################################
	    // POST: checkout, post the item being purchased
	    // This post will read the shop item and find out the token + price associated with it
	    // It then creates payment transaction and inserts the payment data to the firebase
	    // Finally adds to the users entitlement new tokens to use.
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
	                    if (JPS.specialUser.admin) {
	                        console.log("USER requesting cashpay is ADMIN");
	                        return JPS.firebase.database().ref('/users/' + JPS.forUserId).once('value');
	                    }
	                    throw (new Error("Non admin user requesting cashbuy."))
	                })
	                .then(snapshot => {
	                    JPS.forUser = snapshot.val()
	                    JPS.forUser.key = snapshot.key;
	                    switch(JPS.itemType){
	                      case "special":
	                        return JPS.firebase.database().ref('/specialCourses/' + JPS.shopItemKey).once('value');
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
	                                    id: "myyjä: " + JPS.user.sukunimi,
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
	                        JPS.shopItem.expires = JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000);
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
	                                JPS.shopItem.expires = JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000);
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
	                      console.log("special course purchase ok....");
	                      JPS.shopItem.expires = 0;
	                      JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
	                          .update(Object.assign(JPS.transaction, JPS.shopItem))
	                          .then(() => {
	                            return JPS.firebase.database().ref('/scbookingsbycourse/' + JPS.shopItemKey + '/' + JPS.forUser.key)
	                            .update({transactionReference: JPS.now, shopItem: JPS.shopItem})
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
/* 5 */
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
	                    JPS.user = snapshot.val()
	                    JPS.user.key = snapshot.key;
	                    switch(JPS.itemType){
	                      case "special":
	                        return JPS.firebase.database().ref('/specialCourses/' + JPS.shopItemKey).once('value');
	                      default:
	                        return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
	                    }

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
	                            JPS.shopItem.expires = JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000);
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
	                                    JPS.shopItem.expires = JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000);
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
	                          console.log("special course purchase....");
	                          JPS.shopItem.expires = 0;
	                          JPS.firebase.database().ref('/transactions/' + JPS.user.key + '/' + JPS.now)
	                              .update(Object.assign(JPS.transaction, JPS.shopItem))
	                              .then(() => {
	                                return JPS.firebase.database().ref('/scbookingsbycourse/' + JPS.shopItemKey + '/' + JPS.user.key)
	                                .update({transactionReference: JPS.now, shopItem: JPS.shopItem})
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
/* 6 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){

	  //######################################################
	  // POST: reserveSlot
	  // Reduces from the user needed tokens and assigns the user to the slot.
	  // Caller must check that the user is entitled to the reservation.
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
	      JPS.courseInfo = JPS.post.courseInfo;
	      JPS.weeksForward = JPS.post.weeksForward;
	      JPS.timezoneOffset = JPS.post.timezoneOffset;

	      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
	      .then( decodedToken => {
	        JPS.currentUserUID = decodedToken.sub;
	        console.log("User: ", JPS.currentUserUID, " requested checkout.");
	        return JPS.firebase.database().ref('/users/'+JPS.currentUserUID).once('value')
	      })
	      .then ( snapshot => {
	        if(snapshot.val() == null){
	          throw(new Error("User record does not exist in the database: " + JPS.currentUserUID))
	        }
	        JPS.user = snapshot.val();
	        JPS.user.key = snapshot.key;
	        console.log("USER:",JPS.user);
	        console.log("courseINFO:",JPS.courseInfo);
	        JPS.userHasTime = false;
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
	          switch(JPS.allTx[JPS.one].type){
	            case "time":
	              if(JPS.allTx[JPS.one].expires > JPS.now){
	                    JPS.userHasTime = true;
	              }
	              break;
	            case "count":
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
	              break;
	            default:
	              console.error("Unrecognized transaction type: ", JPS.allTx[JPS.one].type);
	              break;
	          }
	        } // for - looping through transactions
	        JPS.transactionReference = 0; //Leave it 0 if bookign is based on time-token.
	        if(!JPS.userHasTime){
	          console.log("User does not have time.");
	          if(!JPS.userHasCount){
	            console.log("User does not have count");
	            throw( new Error("User is not entitled to book this slot"));
	          }
	          else { //Process user has count option
	            JPS.transactionReference = JPS.earliestToExpire;
	            //TODO: Check tahat user has not already booked in to the course before reducing count.
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
	          } else {
	          console.log("User has time.");
	          }
	          //If user is entitled, write the bookings in to the database
	          if(JPS.userHasTime || JPS.userHasCount){
	            JPS.courseTime = JPS.timeHelper.getCourseTimeUTC(JPS.weeksForward, JPS.courseInfo.start, JPS.courseInfo.day)
	            JPS.bookingTime = JPS.courseTime.getTime();
	            JPS.firebase.database().ref('/bookingsbycourse/'+JPS.courseInfo.key+'/'+JPS.bookingTime+'/'+JPS.user.key)
	            .update({
	              user: (JPS.user.alias)? JPS.user.alias : JPS.user.firstname + " " + JPS.user.lastname,
	              transactionReference: JPS.transactionReference,
	              courseName: JPS.courseInfo.courseType.name,
	              courseTime: JPS.bookingTime
	            })
	            .then( err => {
	              if(err){
	                console.error("Booking by COURSE write to firabase failed: ", err);
	                throw(new Error("Booking by COURSE write to firabase failed: " + err.toString()))
	              }
	              return JPS.firebase.database().ref('/bookingsbyuser/'+JPS.user.key+'/'+JPS.courseInfo.key+'/'+JPS.bookingTime)
	              .update({
	                transactionReference: JPS.transactionReference,
	                courseName: JPS.courseInfo.courseType.name,
	                courseTime: JPS.bookingTime
	              })
	            })
	            .then( err => {
	              if(err){
	                console.error("Booking by USER write to firabase failed: ", err);
	                throw(new Error("Booking by USER write to firabase failed: " + err.toString()))
	              }
	              else{
	                //======================================
	                res.status(200).jsonp({context: "Booking done succesfully" }).end();
	                JPS.mailer.sendConfirmation(JPS.user.email, JPS.courseInfo, JPS.courseTime); //Send confirmation email
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
	        res.status(500).jsonp({context: "Reserve slot failed"}).end(err);
	      })
	    })
	  })
	}


/***/ },
/* 7 */
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
/* 8 */
/***/ function(module, exports) {

	var JHLP = {}

	module.exports = {
	    getCourseTimeUTC: (weeksForward, timeOfStart, dayNumber) => {

	        JHLP.courseTime = new Date();
	        JHLP.dayNumber = JHLP.courseTime.getDay()
	        JHLP.dayNumber = (JHLP.dayNumber == 0) ? 7 : JHLP.dayNumber;
	        JHLP.daysToAdd = weeksForward * 7 + dayNumber - JHLP.dayNumber;

	        JHLP.courseTime.setHours(0);
	        JHLP.courseTime.setMinutes(0);
	        JHLP.courseTime.setSeconds(0);
	        JHLP.courseTime.setMilliseconds(0);
	        JHLP.courseTime.setTime(JHLP.courseTime.getTime() + JHLP.daysToAdd * 24 * 60 * 60 * 1000 + timeOfStart);

	        return JHLP.courseTime;
	    },
	    getDayStr: (day) => {
	        return day.getDate() + "." + day.getMonth() + "." + day.getFullYear()
	    },
	    getTimeStr: (day) => {
	        return day.toTimeString()
	    }
	}

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = require("braintree");

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = require("firebase");

/***/ },
/* 12 */
/***/ function(module, exports) {

	module.exports = require("mailgun-js");

/***/ }
/******/ ]);