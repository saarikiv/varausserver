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
/******/ 	__webpack_require__.p = "/home/saarikiv/joogaserver/public/";

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

	var express = __webpack_require__(8)
	var JPS = {} //The global.
	JPS.timeHelper = __webpack_require__(6)

	JPS.braintree = __webpack_require__(7);

	console.log("ENV: ", process.env.PWD);
	if(process.env.NODE_ENV == "production") {
	  JPS.firebaseConfig = {
	    serviceAccount: "public/joogakoulusilta.json",
	    databaseURL: "https://joogakoulusilta-654a9.firebaseio.com"
	  };
	}
	else {
	  JPS.firebaseConfig = {
	    serviceAccount: "public/joogakoulusilta-projekti.json",
	    databaseURL: "https://joogakoulusilta-projekti.firebaseio.com"
	  };
	}
	JPS.firebase = __webpack_require__(9)
	JPS.app = express();
	JPS.date = new Date();
	JPS.listenport = 3000
	JPS.firebase.initializeApp(JPS.firebaseConfig);

	JPS.ShopItemsRef = JPS.firebase.database().ref('/shopItems/')
	JPS.UsersRef = JPS.firebase.database().ref('/users/')
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
	__webpack_require__(5).setApp(JPS);

	// Get client token
	__webpack_require__(1).setApp(JPS);

	// POST checkout
	__webpack_require__(3).setApp(JPS);

	// POST reserve slot
	__webpack_require__(4).setApp(JPS);

	// POST reserve slot
	__webpack_require__(2).setApp(JPS);

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
	  JPS.firebase.auth().verifyIdToken(req.query.token).then( decodedToken => {
	  var uid = decodedToken.sub;
	  console.log("User: ", uid, " requested client token.");
	  JPS.gateway.clientToken.generate({}, (err, response) => {
	        if (err) {
	          console.error("Client token generation failed:", err);
	          console.error("Client token response:", response);
	          res.statusCode = 500;
	          res.end(err);
	        }
	        else {
	          console.log("Sending client token: ", response.clientToken);
	          res.statusCode = 200;
	          res.end(response.clientToken);
	        }
	    })
	  }).catch( err => {
	    console.error("Unauthorized access attempetd: ", err);
	    res.statusCode = 500;
	    res.end(err);
	  });
	})
	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){

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

	      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken).then( decodedToken => {
	        JPS.currentUserUID = decodedToken.sub;
	        console.log("User: ", JPS.currentUserUID, " requested checkout.");

	        JPS.OneUserRef = JPS.firebase.database().ref('/users/'+JPS.currentUserUID);
	        JPS.OneUserRef.once('value', snapshot => {
	          JPS.user = snapshot.val();
	          JPS.user.key = snapshot.key;

	          console.log("USER:",JPS.user);

	          JPS.bookingsbycourseRef = JPS.firebase.database().ref('/bookingsbycourse/' + JPS.courseInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key);
	          JPS.bookingsbycourseRef.remove( err => {
	            if(err){
	              res.status(500).jsonp({message: "Removing bookingsbycourse failed."}).end(err);
	            }
	            JPS.bookingsbyuserRef = JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' +JPS.courseInfo.key + '/' + JPS.cancelItem);
	            JPS.bookingsbyuserRef.remove( err => {
	              if(err){
	                res.status(500).jsonp({message: "Removing bookingsbyuser failed."}).end(err);
	              }
	              if(JPS.transactionReference != 0){
	                //Give back one use time for the user
	                JPS.TransactionRef = JPS.firebase.database().ref('/transactions/'+JPS.user.key+'/'+JPS.transactionReference);
	                JPS.TransactionRef.once('value', snapshot => {
	                  console.log("TRANSACTION: ", snapshot.val());
	                  JPS.unusedtimes = snapshot.val().unusedtimes;
	                  JPS.unusedtimes++;
	                  JPS.TransactionRef.update({unusedtimes: JPS.unusedtimes}, err => {
	                    if(err){
	                      res.status(500).jsonp({message: "failed giving back tokens."}).end(err);
	                    }
	                    else {
	                      res.status(200).jsonp({message : "Cancellation was succesfull."}).end()
	                    }
	                  })
	                }, err => {
	                  res.status(500).jsonp({message: "failed to get transaction"}).end(err);
	                })
	              } else {
	                res.status(200).jsonp({message : "Cancellation was succesfull."}).end()
	              }
	            });
	          });

	        }, err => {
	          console.error("Failed to fetch user details for: ", JPS.currentUserUID, err);
	          res.status(500).jsonp({message: "User fetch failes", user: JPS.currentUserUID}).end(err);
	        });
	      }).catch( err => {
	        console.error("Unauthorized access attempetd: ", err);
	        res.status(500).jsonp({message: "Unauthorized access"}).end(err);
	      });
	    })
	  })
	}


/***/ },
/* 3 */
/***/ function(module, exports) {

	

	exports.setApp = function (JPS){

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
	      console.log("POST:", JPS.post);

	      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken).then( decodedToken => {
	        JPS.currentUserUID = decodedToken.sub;
	        console.log("User: ", JPS.currentUserUID, " requested checkout.");

	        JPS.OneUserRef = JPS.firebase.database().ref('/users/'+JPS.currentUserUID);
	        JPS.OneUserRef.once('value', snapshot => {
	          JPS.user = snapshot.val()
	          JPS.user.key = snapshot.key;

	          JPS.ShopItemsRef.orderByKey().equalTo(JPS.shopItemKey).once('child_added', snapshot => {
	            JPS.shopItem = snapshot.val();
	            console.log("/n*************/nShopitem:", JPS.shopItem);
	            JPS.gateway.transaction.sale({
	                        amount: JPS.shopItem.price,
	                        paymentMethodNonce: JPS.nonceFromTheClient,
	                        options: {
	                          submitForSettlement: true
	                        }
	                    },  (err, result) => {
	                      if(err) {
	                        console.error(err);

	                      } else {
	                        res.statusCode = 200;
	                      }
	                      res.end();

	                      JPS.transaction = {
	                        user: JPS.user.key,
	                        shopItem: JPS.shopItem,
	                        error: err ? err : {code: 0},
	                        details: result
	                      }

	                      JPS.TransactionRef = JPS.firebase.database().ref('/transactions/'+JPS.user.key+'/'+JPS.now);
	                      JPS.TransactionRef.update(JPS.transaction, (error) => {
	                          if(error){
	                              console.error("Transaction write to database failed", error);
	                          }
	                          else{
	                            console.log("Ttranaction created: ", JPS.transaction);
	                          }
	                      })

	                      JPS.TokenRef = JPS.firebase.database().ref('/tokens/' + JPS.shopItem.token);
	                      JPS.TokenRef.once('value', tokenSnapshot => {
	                        JPS.token = tokenSnapshot.val();

	                        console.log("USER & TOKEN: ",JPS.user, JPS.token);

	                        console.log("UT: ", JPS.token);
	                        //calculate the expiry moment if type is count
	                        if(JPS.token.type === "count") {
	                          JPS.token.expires = JPS.date.setTime(JPS.now + JPS.token.expiresAfterDays*24*60*60*1000);
	                          JPS.token.unusedtimes = JPS.token.usetimes;
	                        }
	                        if(JPS.token.type === "time") {
	                          // TODO: need to find out the last - now just using NOW
	                          JPS.lastTimeUserHasValidUseTime = JPS.now;
	                          JPS.token.expires = JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.token.usedays*24*60*60*1000);
	                        }
	                        JPS.TransactionRef.update(JPS.token, err =>{
	                          if(err){
	                            console.error("Failed inserting userToken in to DB: ", err);
	                          } else {
	                            console.log("Usertoken saved: ", JPS.token);
	                          }
	                        })
	                      }, err => {
	                        console.error("Fetching token info failed: ", err);
	                      })
	                    })
	                  }, err => {
	            console.error("Failed reading shopItem details: ", err);
	            res.statusCode = 500;
	            res.end();
	          })
	        }, err => {
	          console.error("Failed to fetch user details for: ", JPS.currentUserUID, err);
	        });
	    }).catch( err => {
	      console.error("Unauthorized access attempetd: ", err);
	      res.statusCode = 500;
	      res.end(err);
	    });
	  })
	})
	}


/***/ },
/* 4 */
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

	      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken).then( decodedToken => {
	        JPS.currentUserUID = decodedToken.sub;
	        console.log("User: ", JPS.currentUserUID, " requested checkout.");

	        JPS.OneUserRef = JPS.firebase.database().ref('/users/'+JPS.currentUserUID);
	        JPS.OneUserRef.once('value', snapshot => {
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
	          JPS.UserTransactionsRef = JPS.firebase.database().ref('/transactions/'+JPS.currentUserUID);
	          JPS.UserTransactionsRef.once('value', snapshot => {
	            console.log("Processing returned data:");
	            JPS.allTx = snapshot.val();
	            for (JPS.one in JPS.allTx){
	              console.log("Processing individual record:", JPS.one);
	              switch(JPS.allTx[JPS.one].type){
	                case "time":
	                console.log("Processing time: ", JPS.allTx[JPS.one]);
	                  if(JPS.allTx[JPS.one].expires > JPS.now){
	                    console.log("User has time!!");
	                    JPS.userHasTime = true;
	                  }
	                  break;
	                case "count":
	                console.log("Processing count: ", JPS.allTx[JPS.one]);
	                  console.log("expires: ", JPS.allTx[JPS.one].expires);
	                  console.log("now: ", JPS.now);
	                  console.log("unusedtimes: ", JPS.allTx[JPS.one].unusedtimes);
	                  if((JPS.allTx[JPS.one].expires > JPS.now) && (JPS.allTx[JPS.one].unusedtimes > 0)){
	                    console.log("User has count!!");
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
	                  res.statusCode = 500;
	                  res.end();
	                  break;
	              }
	            }
	            JPS.transactionReference = 0; //Leave it 0 if bookign is based on time-token.
	            if(!JPS.userHasTime){
	              console.log("User does not have time.");
	              if(!JPS.userHasCount){
	                console.log("User does not have count");
	                res.status(500).jsonp({context: "User is not entitled to book this slot" }).end();
	              }
	              else {
	                //TODO: Check tahat user has not already booked in to the course before reducing count.
	                JPS.recordToUpdate.unusedtimes = JPS.recordToUpdate.unusedtimes - 1;
	                JPS.unusedtimes = JPS.unusedtimes - 1;
	                JPS.firebase.database()
	                  .ref('/transactions/'+JPS.currentUserUID+'/'+JPS.earliestToExpire)
	                  .update({unusedtimes: JPS.unusedtimes}, err => {
	                    if(err){
	                      console.error("Failed to update user transaction data:", JPS.currentUserUID, JPS.earliestToExpire, err);
	                      res.statusCode = 500;
	                      res.end();

	                    } else {
	                      JPS.transactionReference = JPS.earliestToExpire;
	                      console.log("Updated transaction date for user: ", JPS.currentUserUID);
	                    }
	                })
	              }
	            } else {
	              console.log("User has time.");
	            }
	            JPS.courseTime = JPS.timeHelper.getCourseTimeGMT(JPS.weeksForward, JPS.courseInfo.start, JPS.courseInfo.day)
	            JPS.bookingTime = JPS.courseTime.getTime();
	            JPS.BookingByCourseRef = JPS.firebase.database().ref('/bookingsbycourse/'+JPS.courseInfo.key+'/'+JPS.bookingTime+'/'+JPS.user.key);
	            JPS.BookingByCourseRef.update({
	              user: JPS.user.email, //TODO: add other information to be displayed in the aplication
	              transactionReference: JPS.transactionReference
	            }, err => {
	              if(err){
	                console.error("Booking by COURSE write to firabase failed: ", err);
	                res.status(500).jsonp({context: "Booking by COURSE write failed", err }).end();
	              }
	            })
	            JPS.BookingByUserRef = JPS.firebase.database().ref('/bookingsbyuser/'+JPS.user.key+'/'+JPS.courseInfo.key+'/'+JPS.bookingTime);
	            JPS.BookingByUserRef.update({
	              transactionReference: JPS.transactionReference
	            }, err => {
	              if(err){
	                console.error("Booking by USER write to firabase failed: ", err);
	                res.statusCode = 500;
	                res.end();
	              }
	            })

	            res.status(200).jsonp({context: "Booking done succesfully" }).end();
	          }, err => {
	            console.error("Fetching user transactions failed: ", err);
	            res.statusCode = 500;
	            res.end();
	          })

	        }, err => {
	          console.error("Failed to fetch user details for: ", JPS.currentUserUID, err);
	          res.statusCode = 500;
	          res.end();
	        });
	      }).catch( err => {
	        console.error("Unauthorized access attempetd: ", err);
	        res.statusCode = 500;
	        res.end(err);
	      });
	    })
	  })
	}


/***/ },
/* 5 */
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
/* 6 */
/***/ function(module, exports) {

	
	module.exports = {
	  getCourseTimeGMT: (weeksForward, timeOfStart, dayNumber) => {

	  var JHLP = {}
	  JHLP.courseTime = new Date();
	  JHLP.dayNumber = JHLP.courseTime.getDay()
	  JHLP.dayNumber = (JHLP.dayNumber == 0)? 7 : JHLP.dayNumber;
	  JHLP.daysToAdd = weeksForward*7 + dayNumber - JHLP.dayNumber;

	  JHLP.courseTime.setHours(0);
	  JHLP.courseTime.setMinutes(0);
	  JHLP.courseTime.setSeconds(0);
	  JHLP.courseTime.setMilliseconds(0);
	  JHLP.courseTime.setTime(JHLP.courseTime.getTime() + JHLP.daysToAdd*24*60*60*1000 + timeOfStart);

	  return JHLP.courseTime;
	  }
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("braintree");

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = require("firebase");

/***/ }
/******/ ]);