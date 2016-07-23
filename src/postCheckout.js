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
