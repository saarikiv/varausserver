
var md5 = require ('md5')

exports.setApp = function (JPS){

//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################

  JPS.app.get('/paytrailnotification', (req, res) => {
    JPS.merchantAuthenticationhash = "6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ"
    console.log("paytrailnotification requested");
    console.log("ORDER_NUMBER", req.query.ORDER_NUMBER);
    console.log("TIMESTAMP", req.query.TIMESTAMP);
    console.log("PAID", req.query.PAID);
    console.log("METHOD", req.query.METHOD);
    console.log("RETURN_AUTHCODE", req.query.RETURN_AUTHCODE);
    JPS.hashOK = md5(req.query.ORDER_NUMBER + '|' + req.query.TIMESTAMP + '|' + req.query.PAID + '|' + req.query.METHOD + '|' + JPS.merchantAuthenticationhash).toUpperCase()
    JPS.hashNOK = md5(req.query.ORDER_NUMBER + '|' + req.query.TIMESTAMP + '|' + JPS.merchantAuthenticationhash).toUpperCase()
    console.log("HASH-OK", JPS.hashOK);
    console.log("HASH-NOK", JPS.hashNOK);
    JPS.orderNumber = req.query.ORDER_NUMBER;
    JPS.timeStamp = req.query.TIMESTAMP;
    JPS.paymentTransactionRef = req.query.PAID;
    JPS.paymentMethod = req.query.METHOD
    JPS.authorizationCode = req.query.RETURN_AUTHCODE;
    if(req.query.PAID){
      console.log("Transaction was paid OK");
      if(JPS.hashOK === req.query.RETURN_AUTHCODE){
        console.log("Authorization code matches!!", JPS.hashOK);
        console.log("start processing: ", JPS.orderNumber);
        JPS.firebase.database().ref('/pendingtransactions/'+JPS.orderNumber).once('value')
        .then(snapshot => {
          if(snapshot.val() != null){
            JPS.pendingTransaction = snapshot.val()
            console.log("Processing pending transaction: ", JPS.pendingTransaction)
            return JPS.firebase.database().ref('/transactions/'+JPS.pendingTransaction.user+'/'+JPS.pendingTransaction.timestamp)
            .update(Object.assign(
              JPS.pendingTransaction.transaction, 
              JPS.pendingTransaction.shopItem, {
              details: {
                success: true,
                transaction: {
                  pendingTransaction: JPS.orderNumber,
                  amount: JPS.pendingTransaction.shopItem.price,
                  currencyIsoCode: "EUR",
                  id: JPS.paymentTransactionRef,
                  paymentInstrumentType: "PayTrail",
                  paymentMethod: JPS.paymentMethod 
                }
              }
            }))
            .then(() => {
              console.log("Pending transaction processed succesfully. Removing pending record.");
              return JPS.firebase.database().ref('/pendingtransactions/'+JPS.orderNumber).remove();
            })
            .then(() => {
              console.log("Pending record removed successfully.");
              if(JPS.pendingTransaction.shopItem.type === "special"){
                    JPS.firebase.database().ref('/scbookingsbycourse/' + JPS.pendingTransaction.shopItem.key + '/' + JPS.pendingTransaction.user)
                    .update({transactionReference: JPS.paymentTransactionRef, shopItem: JPS.pendingTransaction.shopItem})
                    .then(() => {
                        return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.pendingTransaction.user + '/' + JPS.pendingTransaction.shopItem.key)
                        .update({transactionReference: JPS.paymentTransactionRef, shopItem: JPS.pendingTransaction.shopItem})
                    })
                    .then(()=>{
                        console.log("Updated SC-bookings succesfully");
                    })
                    .catch(error => {
                      console.error("Processing SC-bookings failed: ", JPS.orderNumber, error);
                      throw(new Error("Processing SC-bookings failed: " + JPS.orderNumber + error.message))
                    })                        
              }                 
            })
            .catch(error => {
              console.error("Processing pendingtransactions failed: ", JPS.orderNumber, error);
              throw(new Error("Processing pendingtransactions failed: " + JPS.orderNumber + error.message))
            })
          } else {
            console.log("Pending transaction has already been cleared");
          }
        })
////////////////
      } else {
        console.error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK);
        throw (new Error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK))
      }
    }
    else{
      console.log("Payment did not clear or was cancelled. Remove the pending transaction: ", JPS.orderNumber);
      JPS.firebase.database().ref('/pendingtransactions/'+JPS.orderNumber).remove()
      .then(() => {
        console.log("Pending transaction for NOK payment removed: ", JPS.orderNumber);
      })
      .catch(error => {
        console.error("Removing pending transaction failed.");
        throw (new Error("Removing pending transaction failed." + error.message))
      })
    }
    res.status(200).end();
  })
}
