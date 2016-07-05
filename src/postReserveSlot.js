
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
      JPS.currentUserKey = JPS.post.user;
      JPS.slot = JPS.post.slot;

      JPS.UserRef = JPS.firebase.database().ref('/users/' + JPS.currentUserKey);

      JPS.UserRef.once('value', userSnapshot => {

        JPS.user = userSnapshot.val();
        console.log(JPS.user);

        var ut = JPS.user.tokens.usetimes;
        var ld = JPS.user.tokens.lastday;

        //TODO: chek if use time is ok
        //TODO: manipulate the ut
        ut -= 1;

        JPS.UserRef.update({tokens: { usetimes: ut, lastday: ld }}, (err) =>{
          if(err){
            console.error("User update failed: ", err);
          }
        });

        JPS.BookingRef.push({
          user: JPS.currentUserKey,
          slot: JPS.slot.key
        }, err => {
          if(err){
          console.error("Booking write to firabase failed: ", err);
          }
        })

      },err => {
        if(err){
          console.error("Fetching user details failed: ", err);
        }
      })

      res.statusCode = 200;
      res.end();
    })
  })

}
