
exports.setApp = function (JPS){

  //######################################################
  // POST: reserveSlot
  // Reduces from the user needed tokens and assigns the user to the slot.
  // Caller must check that the user is entitled to the reservation.
  //######################################################

  JPS.app.post('/reserveSlot', (req, res) => {
    JPS.now = Date.now();
    console.log("POST: reserveslot", JPS.now);
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
      JPS.weeksForward = JPS.post.weeksForward;

      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken).then( decodedToken => {
        JPS.currentUserUID = decodedToken.sub;
        console.log("User: ", JPS.currentUserUID, " requested checkout.");

        JPS.OneUserRef = JPS.firebase.database().ref('/users/'+JPS.currentUserUID);
        JPS.OneUserRef.once('value', snapshot => {
          JPS.user = snapshot.val();
          JPS.user.key = snapshot.key;

          console.log("USER:",JPS.user);
          console.log("courseINFO:",JPS.courseInfo);

          JPS.userHasTime = false;
          JPS.userHasCount = false;
          JPS.earliestToExpire = 0;
          JPS.expiryTime = 9999999999999;
          JPS.recordToUpdate = {};
          JPS.unusedtimes = 0;

          console.log("Starting to process user transactions");
          JPS.UserTransactionsRef = JPS.firebase.database().ref('/transactions/'+JPS.currentUserUID);
          JPS.UserTransactionsRef.once('value', snapshot => {
            console.log("Processing returned data:");
            JPS.allTx = snapshot.val();
            for (JPS.one in JPS.allTx){
              console.log("Processing individual record:", JPS.one);
              switch(JPS.allTx[JPS.one].type){
                case "time":
                console.log("Processing time: ", JPS.allTx[JPS.one]);
                  if(JPS.allTx[JPS.one].expires > JPS.now){
                    console.log("User has time!!");
                    JPS.userHasTime = true;
                  }
                  break;
                case "count":
                console.log("Processing count: ", JPS.allTx[JPS.one]);
                  console.log("expires: ", JPS.allTx[JPS.one].expires);
                  console.log("now: ", JPS.now);
                  console.log("unusedtimes: ", JPS.allTx[JPS.one].unusedtimes);
                  if((JPS.allTx[JPS.one].expires > JPS.now) && (JPS.allTx[JPS.one].unusedtimes > 0)){
                    console.log("User has count!!");
                    JPS.userHasCount = true;
                    //Find the earliest to expire record
                    if(JPS.allTx[JPS.one].expires < JPS.expiryTime){
                      JPS.earliestToExpire = JPS.one;
                      JPS.expiryTime = JPS.allTx[JPS.one].expires;
                      JPS.recordToUpdate = JPS.allTx[JPS.one];
                      JPS.unusedtimes = JPS.allTx[JPS.one].unusedtimes;
                    }
                  }
                  break;
                default:
                  console.error("Unrecognized transaction type: ", JPS.allTx[JPS.one].type);
                  res.statusCode = 500;
                  res.end();
                  break;
              }
            }

            if(!JPS.userHasTime){
              console.log("User does not have time.");
              if(!JPS.userHasCount){
                console.log("User does not have count");
                res.statusCode = 500;
                res.end();
              }
              else {
                //TODO: Check tahat user has not already booked in to the course before reducing count.
                JPS.recordToUpdate.unusedtimes = JPS.recordToUpdate.unusedtimes - 1;
                JPS.unusedtimes = JPS.unusedtimes - 1;
                JPS.firebase.database()
                  .ref('/transactions/'+JPS.currentUserUID+'/'+JPS.earliestToExpire)
                  .update({unusedtimes: JPS.unusedtimes}, err => {
                    if(err){
                      console.error("Failed to update user transaction data:", JPS.currentUserUID, JPS.earliestToExpire, err);
                      res.statusCode = 500;
                      res.end();

                    } else {
                      console.log("Updated transaction date for user: ", JPS.currentUserUID);
                    }
                })
              }
            } else {
              console.log("User has time.");
            }

            JPS.courseTime = new Date();
            JPS.courseTime.setHours(0);
            JPS.courseTime.setMinutes(0);
            JPS.courseTime.setSeconds(0);
            JPS.courseTime.setMilliseconds(0);
            if(JPS.courseInfo.day < JPS.courseTime.getDay()+1){
              JPS.daysToAdd = (JPS.weeksForward*7) + 7 + JPS.courseInfo.day - JPS.courseTime.getDay()+1;
            } else {
              JPS.daysToAdd = (JPS.weeksForward*7) + JPS.courseInfo.day - JPS.courseTime.getDay()+1;
            }
            JPS.bookingTime = JPS.courseTime.getTime() + JPS.daysToAdd*24*60*60*1000 + JPS.courseInfo.start;
            JPS.BookingByCourseRef = JPS.firebase.database().ref('/bookingsbycourse/'+JPS.courseInfo.key+'/'+JPS.bookingTime+'/'+JPS.user.key);
            JPS.BookingByCourseRef.update({
              user: JPS.user.email
            }, err => {
              if(err){
                console.error("Booking by COURSE write to firabase failed: ", err);
                res.status(500).jsonp({context: "Booking by COURSE write failed", err }).end();
              }
            })
            JPS.BookingByUserRef = JPS.firebase.database().ref('/bookingsbyuser/'+JPS.user.key+'/'+JPS.bookingTime);
            JPS.BookingByUserRef.update({
              course: JPS.courseInfo.key
            }, err => {
              if(err){
                console.error("Booking by USER write to firabase failed: ", err);
                res.statusCode = 500;
                res.end();
              }
            })

            res.status(200).jsonp({context: "Booking done succesfully" }).end();
          }, err => {
            console.error("Fetching user transactions failed: ", err);
            res.statusCode = 500;
            res.end();
          })

        }, err => {
          console.error("Failed to fetch user details for: ", JPS.currentUserUID, err);
          res.statusCode = 500;
          res.end();
        });
      }).catch( err => {
        console.error("Unauthorized access attempetd: ", err);
        res.statusCode = 500;
        res.end(err);
      });
    })
  })
}
