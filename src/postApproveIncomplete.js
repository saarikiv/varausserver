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
                        console.log("USER requesting cashpay is ADMIN or INSTRUCTOR");
                        return JPS.firebase.database().ref('/pendingtransactions/' + JPS.pendingTransactionKey).once('value');
                    }
                    throw (new Error("Non admin or instructor user requesting cashbuy."))
                })
                .then(snapshot => {
                    JPS.pendingTransaction = snapshot.val()
                    console.log("Processing pending transaction: ", JPS.pendingTransaction)
                    JPS.dataToUpdate = Object.assign(
                      JPS.pendingTransaction.transaction, 
                      JPS.pendingTransaction.shopItem, {
                      details: {
                        success: true,
                        transaction: {
                          pendingTransaction: JPS.pendingTransactionKey,
                          amount: JPS.pendingTransaction.shopItem.price,
                          currencyIsoCode: "EUR",
                          id: JPS.user.lastname,
                          paymentInstrumentType: "Admin" 
                        }
                      }
                    })
                    return JPS.firebase.database().ref('/transactions/'+JPS.pendingTransaction.user+'/'+JPS.pendingTransaction.timestamp)
                    .update(JPS.dataToUpdate)                    
                }).then(() => {
                    console.log("Pending transaction processed succesfully. Removing pending record.");
                    return JPS.firebase.database().ref('/pendingtransactions/'+JPS.pendingTransactionKey).remove();
                  })
                  .then(() => {
                    console.log("Pending record removed successfully.");
                    if(JPS.pendingTransaction.shopItem.type === "special"){
                          JPS.firebase.database().ref('/scbookingsbycourse/' + JPS.pendingTransaction.transaction.shopItemKey + '/' + JPS.pendingTransaction.user)
                          .update({transactionReference: JPS.paymentTransactionRef, shopItem: JPS.pendingTransaction.shopItem})
                          .then(() => {
                              return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.pendingTransaction.user + '/' + JPS.pendingTransaction.transaction.shopItemKey)
                              .update({transactionReference: JPS.paymentTransactionRef, shopItem: JPS.pendingTransaction.shopItem})
                          })
                          .then(()=>{
                              console.log("Updated SC-bookings succesfully");
                              JPS.mailer.sendReceipt(JPS.pendingTransaction.receiptEmail, JPS.dataToUpdate, JPS.pendingTransaction.timestamp);
                              res.status(200).end();
                          })
                          .catch(error => {
                            console.error("Processing SC-bookings failed: ", JPS.orderNumber, error);
                            throw(new Error("Processing SC-bookings failed: " + JPS.orderNumber + error.message))
                          })                        
                    } else {
                      JPS.mailer.sendReceipt(JPS.pendingTransaction.receiptEmail, JPS.dataToUpdate, JPS.pendingTransaction.timestamp);
                      res.status(200).end();
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