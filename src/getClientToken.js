
exports.setApp = function (JPS){
//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################
JPS.app.get('/clientToken', (req, res) => {
  console.log("ClientToken requested");
  JPS.gateway.clientToken.generate({}, (err, response) => {
        if (err) {
          console.error(err);
          console.error(response);
          res.statusCode = 500;
          res.end(err);
        }
        else {
          console.log("Sending client token: ", response.clientToken);
          res.end(response.clientToken);
        }
    })
})
}
