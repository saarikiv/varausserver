exports.setApp = function(JPS) {

    //######################################################
    // POST: checkout, post the item being purchased
    // This post will read the shop item and find out the token + price associated with it
    // It then creates payment transaction and inserts the payment data to the firebase
    // Finally adds to the users entitlement new tokens to use.
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
                    JPS.transaction = {
                            user: JPS.user.key,
                            shopItem: JPS.shopItem,
                            shopItemKey: JPS.shopItemKey,
                            error: { code: 0 },
                            details: result
                        }
                        //==================================
                        // Write the transaction to the database
                        //==================================
                        //calculate the expiry moment if type is count
                    if (JPS.shopItem.type === "count") {
                        JPS.shopItem.expires = JPS.date.setTime(JPS.now + JPS.shopItem.expiresAfterDays * 24 * 60 * 60 * 1000);
                        JPS.shopItem.unusedtimes = JPS.shopItem.usetimes;
                        JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
                                transaction: JPS.transaction,
                                shopItem: JPS.shopItem,
                                user: JPS.user.key,
                                timestamp: JPS.now
                            },err => {
                                if(err){
                                    throw (new Error(err.message + " " + err.code));
                                }
                            });
                            console.log("Pending count transaction saved: ", JPS.ref);
                            res.status(200).jsonp(JPS.transaction).end();
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
                                JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
                                    transaction: JPS.transaction,
                                    shopItem: JPS.shopItem,
                                    user: JPS.user.key,
                                    timestamp: JPS.now
                                }, err => {
                                    if(err){
                                        console.error(err.message + " " + err.code)
                                        throw (new Error(err.message + " " + err.code));                                        
                                    }
                                })
                            }, err => {
                                console.error(err.message + " " + err.code)
                                throw (new Error(err.message + " " + err.code));
                            });
                            console.log("Pending time transaction saved: ", JPS.transaction, JPS.shopItem);
                            res.status(200).jsonp(JPS.transaction).end();
                    }
                    if(JPS.shopItem.type === "special"){
                        console.log("special course purchase....");
                        JPS.shopItem.expires = 0;
                        JPS.ref = JPS.firebase.database().ref('/pendingtransactions/').push({
                                    transaction: JPS.transaction,
                                    shopItem: JPS.shopItem,
                                    user: JPS.user.key,
                                    timestamp: JPS.now
                                }, err => {
                                    if(err){
                                        console.error(err.message + " " + err.code)
                                        throw (new Error(err.message + " " + err.code));                                        
                                    }
                                })
                            res.status(200).jsonp(JPS.transaction).end();
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
