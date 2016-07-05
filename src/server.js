//## Braintree detskut
//### Sandbox
//Merchant ID: 3gv7c5tq5q7hxrcs
//Public key: gksd667wsgn35wjp
//Private key: 2c01703b7daffd7352eeaada7a4a95e5

var express = require('express')
var http = require('http')
var https = require('https')
var fs = require('fs')
var braintree = require("braintree");
var firebase = require('firebase')


var JPS = {} //The global.

var firebaseConfig = {
  apiKey: "AIzaSyCq544Yq7EEY-5spIe1oFCe8gkOzRkS5ak",
  authDomain: "joogakoulusilta-projekti.firebaseapp.com",
  databaseURL: "https://joogakoulusilta-projekti.firebaseio.com",
  storageBucket: "joogakoulusilta-projekti.appspot.com",
};
firebase.initializeApp(firebaseConfig);
JPS.TransactionRef = firebase.database().ref('/transactions/')
JPS.ShopItemsRef = firebase.database().ref('/shopItems/')
JPS.BookingRef = firebase.database().ref('/bookings/')

JPS.gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "3gv7c5tq5q7hxrcs",
  publicKey: "gksd667wsgn35wjp",
  privateKey: "2c01703b7daffd7352eeaada7a4a95e5"
});


process.on('exit', (code) => {
  console.log("Process exited with code:", code);
})

process.on('uncaughtException', (err) => {
  console.log("Caught exception:", err);
})

var app = express();

/*
const options = {
  key: fs.readFileSync('keys/jooga-key.pem'),
  cert: fs.readFileSync('keys/jooga-cert.pem')
};
*/

http.createServer(app).listen(3000, (err) => {
  if(err) throw err;
  console.log("Listenig on 3000");
});
//https.createServer(options, app).listen(443);

//#############################
// Add headers
//#############################
app.use( (req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'text/plain')
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    // Pass to next layer of middleware
    next();
});


//######################################################
// POST: reserveSlot
// Reduces from the user needed tokens and assigns the user to the slot.
// Caller must check that the user is entitled to the reservation.
//######################################################

app.post('/reserveSlot', (req, res) => {
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

    JPS.UserRef = firebase.database().ref('/users/' + JPS.currentUserKey);

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

//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################
app.get('/clientToken', (req, res) => {
  console.log("ClientToken requested: ", req);
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

//######################################################
// POST: checkout, post the item being purchased
// This post will read the shop item and find out the token + price associated with it
// It then creates payment transaction and inserts the payment data to the firebase
// Finally adds to the users entitlement new tokens to use.
//######################################################
app.post('/checkout', (req, res) => {
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

                JPS.TokenRef = firebase.database().ref('/tokens/' + JPS.shopItem.token);
                JPS.TokenRef.once('value', tokenSnapshot => {
                  JPS.token = tokenSnapshot.val();

                  JPS.UserRef = firebase.database().ref('/users/' + JPS.currentUserKey);
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
