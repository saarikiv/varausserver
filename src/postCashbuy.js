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
                    if(JPS.specialUser.admin){
                      console.log("USER requesting cashpay is ADMIN");
                      return JPS.firebase.database().ref('/users/' + JPS.forUserId).once('value');
                    }
                    throw(new Error("Non admin user requesting cashbuy."))
                })
                .then(snapshot => {
                    JPS.forUser = snapshot.val()
                    JPS.forUser.key = snapshot.key;
                    return JPS.firebase.database().ref('/shopItems/' + JPS.shopItemKey).once('value');
                })
                .then(snapshot => {
                    JPS.shopItem = snapshot.val();

                    JPS.transaction = {
                            user: JPS.forUser.key,
                            shopItem: JPS.shopItem,
                            error: {
                                code: 0
                            },
                            details: {
                              success: true,
                              transaction: {
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
                    }
                    if (JPS.shopItem.type === "time") {
                        // TODO: need to find out the last - now just using NOW
                        JPS.lastTimeUserHasValidUseTime = JPS.now;
                        JPS.shopItem.expires = JPS.date.setTime(JPS.lastTimeUserHasValidUseTime + JPS.shopItem.usedays * 24 * 60 * 60 * 1000);
                    }
                    JPS.firebase.database().ref('/transactions/' + JPS.forUser.key + '/' + JPS.now)
                        .update(Object.assign(JPS.transaction, JPS.shopItem))
                        .then(err => {
                            if (err) {
                                console.error("Failed inserting transaction details in to DB: ", err);
                                throw (new Error(err.message + " " + err.code));
                            } else {
                                console.log("Transaction saved: ", JPS.transaction, JPS.shopItem);
                                res.status(200).jsonp(JPS.transaction).end();
                                console.log("Sending receipt to: ", JPS.forUser.email);
                                JPS.mailer.sendReceipt(JPS.forUser.email, JPS.transaction, JPS.now); //Send confirmation email
                            }
                        }).catch(err => {
                            throw (new Error(err.message + " " + err.code));
                        });

                }).catch(err => {
                    console.error("Cashpay failde: ", err);
                    res.status(500).jsonp({
                        message: "Cashpay failde." + err.toString()
                    }).end(err);
                });
        })
    })
}
