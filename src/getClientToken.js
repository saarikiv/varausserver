
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
          res.statusCode = 500;
          res.end(err);
        }
        else {
          console.log("Sending client token: ", response.clientToken);
          res.statusCode = 200;
          res.end(response.clientToken);
        }
    })
  }).catch( err => {
    console.error("Unauthorized access attempetd: ", err);
    res.statusCode = 500;
    res.end(err);
  });
})
}
