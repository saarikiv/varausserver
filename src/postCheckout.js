
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
