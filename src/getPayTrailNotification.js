
exports.setApp = function (JPS){

//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################

  JPS.app.get('/paytrailnotification', (req, res) => {
    console.log("paytrailnotification requested");
    console.log("ORDER_NUMBER", req.query.ORDER_NUMBER);
    console.log("TIMESTAMP", req.query.TIMESTAMP);
    console.log("PAID", req.query.PAID);
    console.log("METHOD", req.query.METHOD);
    console.log("RETURN_AUTHCODE", req.query.RETURN_AUTHCODE);
    res.status(200).end();
  })
}
