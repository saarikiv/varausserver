
exports.setApp = function (JPS){

  //######################################################
  // POST: cancelSlot
  //######################################################

  JPS.app.post('/cancelSlot', (req, res) => {
    JPS.now = Date.now();
    console.log("POST: cancelSlot", JPS.now);
    JPS.body = '';
    req.on('data', (data) => {
      JPS.body += data;
      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (JPS.body.length > 1e6) req.connection.destroy();
    });
    req.on('end', () => {
      JPS.post = JSON.parse(JPS.body);
      console.log("POST:", JPS.post);
      JPS.currentUserToken = JPS.post.user;
      JPS.courseInfo = JPS.post.courseInfo;
      JPS.cancelItem = JPS.post.cancelItem;
      JPS.txRef = JPS.post.transactionReference;

      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken).then( decodedToken => {
        JPS.currentUserUID = decodedToken.sub;
        console.log("User: ", JPS.currentUserUID, " requested checkout.");

        JPS.OneUserRef = JPS.firebase.database().ref('/users/'+JPS.currentUserUID);
        JPS.OneUserRef.once('value', snapshot => {
          JPS.user = snapshot.val();
          JPS.user.key = snapshot.key;

          console.log("USER:",JPS.user);

          JPS.bookingsbycourseRef = JPS.firebase.database().ref('/bookingsbycourse/' + JPS.courseInfo.key + '/' + JPS.cancelItem + '/' + JPS.user.key);
          JPS.bookingsbycourseRef.remove( err => {
            if(err){
              res.status(500).jsonp({message: "Removing bookingsbycourse failed."}).end(err);
            }
            JPS.bookingsbyuserRef = JPS.firebase.database().ref('/bookingsbyuser/' + JPS.user.key + '/' +JPS.courseInfo.key + '/' + JPS.cancelItem);
            JPS.bookingsbyuserRef.remove( err => {
              if(err){
                res.status(500).jsonp({message: "Removing bookingsbyuser failed."}).end(err);
              }
              if(JPS.txRef != 0){
                //Give back one use time for the user
                JPS.TransactionRef = JPS.firebase.database().ref('/transactions/'+JPS.user.key+'/'+JPS.txRef );
                JPS.TransactionRef.once('value', snapshot => {
                  console.log("TRANSACTION: ", snapshot.val());
                  JPS.unusedtimes = snapshot.val().unusedtimes;
                  JPS.unusedtimes++;
                  JPS.TransactionRef.update({unusedtimes: JPS.unusedtimes}, err => {
                    if(err){
                      res.status(500).jsonp({message: "failed giving back tokens."}).end(err);
                    }
                    else {
                      res.status(200).jsonp({message : "Cancellation was succesfull."}).end()
                    }
                  })
                }, err => {
                  res.status(500).jsonp({message: "failed to get transaction"}).end(err);
                })
              } else {
                res.status(200).jsonp({message : "Cancellation was succesfull."}).end()
              }
            });
          });

        }, err => {
          console.error("Failed to fetch user details for: ", JPS.currentUserUID, err);
          res.status(500).jsonp({message: "User fetch failes", user: JPS.currentUserUID}).end(err);
        });
      }).catch( err => {
        console.error("Unauthorized access attempetd: ", err);
        res.status(500).jsonp({message: "Unauthorized access"}).end(err);
      });
    })
  })
}
