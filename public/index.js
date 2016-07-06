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

	var express = __webpack_require__(7)
	var JPS = {} //The global.

	JPS.braintree = __webpack_require__(6);

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
	JPS.firebase = __webpack_require__(8)
	JPS.app = express();
	JPS.listenport = 3000
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


	__webpack_require__(1).setApp(JPS);

	// Add headers
	__webpack_require__(5).setApp(JPS);

	// Get client token
	__webpack_require__(2).setApp(JPS);

	// POST checkout
	__webpack_require__(3).setApp(JPS);

	// POST reserve slot
	__webpack_require__(4).setApp(JPS);

	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 1 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){
	  //#############################
	  // authenticate
	  //#############################

	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	
	exports.setApp = function (JPS){
	//######################################################
	// GET: clienttoken, needed for the client to initiate payment method
	//######################################################
	JPS.app.get('/clientToken', (req, res) => {
	  console.log("ClientToken requested");
	  JPS.gateway.clientToken.generate({}, (err, response) => {
	        if (err) {
	          console.error(err);
	          console.error(response);
	          res.statusCode = 500;
	          res.end(err);
	        }
	        else {
	          console.log("Sending client token: ", response.clientToken);
	          res.end(response.clientToken);
	        }
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
	      JPS.currentUserKey = JPS.post.current_user;
	      JPS.shopItemKey = JPS.post.item_key;
	      console.log("POST:", JPS.post);

	      JPS.ShopItemsRef.orderByKey().equalTo(JPS.shopItemKey).once('child_added', snapshot => {
	        JPS.shopItem = snapshot.val();
	        console.log("Shopitem:", JPS.shopItem);
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

	                  JPS.TransactionRef.push({
	                            user: JPS.currentUserKey,
	                            token: {
	                              key: JPS.shopItem.token,
	                              used: false
	                            },
	                            error: err ? err : {code: 0},
	                            details: result
	                  }, (error) => {
	                      if(error){
	                          console.error("Transaction write to database failed", error);
	                      }
	                  })

	                  JPS.TokenRef = JPS.firebase.database().ref('/tokens/' + JPS.shopItem.token);
	                  JPS.TokenRef.once('value', tokenSnapshot => {
	                    JPS.token = tokenSnapshot.val();

	                    JPS.UserRef = JPS.firebase.database().ref('/users/' + JPS.currentUserKey);
	                    JPS.UserRef.once('value', userSnapshot => {

	                      JPS.user = userSnapshot.val();
	                      console.log(JPS.user);

	                      var ut = JPS.user.tokens.usetimes;
	                      var ld = JPS.user.tokens.lastday;

	                      if(JPS.token.type === 'count'){
	                        ut += JPS.token.usetimes
	                      }
	                      if(JPS.token.type === 'time'){
	                        // TODO: use actual dates and push last day forward
	                        ld += JPS.token.usedays
	                      }

	                      JPS.UserRef.update({tokens: { usetimes: ut, lastday: ld }}, (err) =>{
	                        if(err){
	                          console.error("User update failed: ", err);
	                        }
	                      });


	                    }, err => {
	                      if(err){
	                        console.error("Fetching user details failed: ", err);
	                      }
	                    })

	                  }, err => {
	                    console.error("Fetching token info failed: ", err);
	                  })


	                })
	              }, error => {
	        console.error("Failed reading shopItem details: ", error);
	        res.statusCode = 500;
	        res.end();
	      })
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
	    console.log("POST: reserveslot");
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
	      JPS.currentUserKey = JPS.post.user;
	      JPS.slot = JPS.post.slot;

	      JPS.UserRef = JPS.firebase.database().ref('/users/' + JPS.currentUserKey);

	      JPS.UserRef.once('value', userSnapshot => {

	        JPS.user = userSnapshot.val();
	        console.log(JPS.user);

	        var ut = JPS.user.tokens.usetimes;
	        var ld = JPS.user.tokens.lastday;

	        //TODO: chek if use time is ok
	        //TODO: manipulate the ut
	        ut -= 1;

	        JPS.UserRef.update({tokens: { usetimes: ut, lastday: ld }}, (err) =>{
	          if(err){
	            console.error("User update failed: ", err);
	          }
	        });

	        JPS.BookingRef.push({
	          user: JPS.currentUserKey,
	          slot: JPS.slot.key
	        }, err => {
	          if(err){
	          console.error("Booking write to firabase failed: ", err);
	          }
	        })

	      },err => {
	        if(err){
	          console.error("Fetching user details failed: ", err);
	        }
	      })

	      res.statusCode = 200;
	      res.end();
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

	module.exports = require("braintree");

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = require("firebase");

/***/ }
/******/ ]);