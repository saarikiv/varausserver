
exports.setApp = function (JPS){

  //######################################################
  // POST: reserveSlot
  // Reduces from the user needed tokens and assigns the user to the slot.
  // Caller must check that the user is entitled to the reservation.
  //######################################################

  JPS.app.post('/reserveSlot', (req, res) => {
    console.log("POST: reserveslot");
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
      JPS.slot = JPS.post.slot;

      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken).then( decodedToken => {
        JPS.currentUserUID = decodedToken.sub;
        console.log("User: ", JPS.currentUserUID, " requested checkout.");

        JPS.UsersRef.orderByChild('uid').equalTo(JPS.currentUserUID).once('child_added', snapshot => {

          JPS.user = snapshot.val()
          JPS.user.key = snapshot.key;

          console.log("USER:",JPS.user);

          var ut = JPS.user.tokens.usetimes;
          var ld = JPS.user.tokens.lastday;

          //TODO: chek if use time is ok
          //TODO: manipulate the ut
          ut -= 1;

          JPS.OneUserRef = JPS.firebase.database().ref('/users/' + JPS.user.key);
          JPS.OneUserRef.update({tokens: { usetimes: ut, lastday: ld }}, (err) =>{
            if(err){
              console.error("User update failed: ", err);
            }
          });

          JPS.BookingRef.push({
            user: JPS.user.key,
            slot: JPS.slot.key
          }, err => {
            if(err){
            console.error("Booking write to firabase failed: ", err);
            }
          })

          res.statusCode = 200;
          res.end();
        }, err => {
          console.error("Failed to fetch user details for: ", JPS.currentUserUID, err);
        });
      }).catch( err => {
        console.error("Unauthorized access attempetd: ", err);
        res.statusCode = 500;
        res.end(err);
      });
    })
  })
}
