
exports.setApp = function (JPS){
//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################
JPS.app.get('/clientToken', (req, res) => {
  console.log("ClientToken requested");
  JPS.firebase.auth().verifyIdToken(req.query.token)
  .then( decodedToken => {
    var uid = decodedToken.sub;
    console.log("User: ", uid, " requested client token.");
    JPS.gateway.clientToken.generate({}, (err, response) => {
      if (err) {
        console.error("Client token generation failed:", err);
        throw(new Error("Token request to braintree gateway failed: err=" + err.toString()))
      }
      else {
        console.log("Sending client token: ", response.clientToken);
        res.status(200).end(response.clientToken);
      }
    })
  })
  .catch( err => {
    console.error("Get client token failed: ", err);
    res.status(500).jsonp({message: "Get client token failed."}).end(err);
  });
})
}
