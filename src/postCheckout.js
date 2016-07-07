
exports.setApp = function (JPS){

  //######################################################
  // POST: checkout, post the item being purchased
  // This post will read the shop item and find out the token + price associated with it
  // It then creates payment transaction and inserts the payment data to the firebase
  // Finally adds to the users entitlement new tokens to use.
  //######################################################
  JPS.app.post('/checkout', (req, res) => {
    console.log("Checkout requested.");
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

        JPS.UsersRef.orderByChild('uid').equalTo(JPS.currentUserUID).once('child_added', snapshot => {

          JPS.user = snapshot.val()
          JPS.user.key = snapshot.key;

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
                                user: JPS.user.key,
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

                        console.log("USER: ",JPS.user);

                        var ut = JPS.user.tokens.usetimes;
                        var ld = JPS.user.tokens.lastday;

                        if(JPS.token.type === 'count'){
                          ut += JPS.token.usetimes
                        }
                        if(JPS.token.type === 'time'){
                          // TODO: use actual dates and push last day forward
                          ld += JPS.token.usedays
                        }
                        JPS.OneUserRef = JPS.firebase.database().ref('/users/' + JPS.user.key);
                        JPS.OneUserRef.update({tokens: { usetimes: ut, lastday: ld }}, (err) =>{
                          if(err){
                            console.error("User update failed: ", err);
                          }
                        });

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
