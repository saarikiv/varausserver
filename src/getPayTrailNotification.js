
var md5 = require ('md5')

exports.setApp = function (JPS){

//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################

  JPS.app.get('/paytrailnotification', (req, res) => {
    var merchantAuthenticationhash = "6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ"
    console.log("paytrailnotification requested");
    console.log("ORDER_NUMBER", req.query.ORDER_NUMBER);
    console.log("TIMESTAMP", req.query.TIMESTAMP);
    console.log("PAID", req.query.PAID);
    console.log("METHOD", req.query.METHOD);
    console.log("RETURN_AUTHCODE", req.query.RETURN_AUTHCODE);
    var hash1 = md5(req.query.ORDER_NUMBER + '|' + req.query.TIMESTAMP + '|' + req.query.PAID + '|' + req.query.METHOD + '|' + merchantAuthenticationhash).toUpperCase()
    var hash2 = md5(req.query.ORDER_NUMBER + '|' + req.query.TIMESTAMP + '|' + merchantAuthenticationhash).toUpperCase()
    console.log("HASH1", hash1);
    console.log("HASH2", hash2);
    res.status(200).end();
  })
}
