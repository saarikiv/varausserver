
exports.setApp = function (JPS){

//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################

  JPS.app.get('/paytrailnotification', (req, res) => {
    console.log("paytrailnotification requested", req, res);
    res.status(200).end();
  })
}
