
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

        JPS.result = JPS.pendingTransactionsHelper.completePendingTransaction(JPS, JPS.orderNumber, JPS.paymentTransactionRef, "PayTrail", JPS.paymentMethod, false)
      } else {
        console.error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK);
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
      })
    }
    res.status(200).end();
  })
}
