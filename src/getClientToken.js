
exports.setApp = function (JPS){
//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################
JPS.app.get('/clientToken', (req, res) => {
  console.log("ClientToken requested");
  JPS.firebase.auth().verifyIdToken(req.query.token).then( decodedToken => {
  var uid = decodedToken.sub;
  console.log("User: ", uid, " requested client token.");
  JPS.gateway.clientToken.generate({}, (err, response) => {
        if (err) {
          console.error("Client token generation failed:", err);
          console.error("Client token response:", response);
          res.status(500).jsonp({message: "Token request failed."}).end(err);
        }
        else {
          console.log("Sending client token: ", response.clientToken);
          res.status(200).end(response.clientToken);
        }
    })
  }).catch( err => {
    console.error("Unauthorized access attempetd: ", err);
    res.status(500).jsonp({message: "Unauthorized attempt to gt token."}).end(err);
  });
})
}
