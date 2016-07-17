
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

      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
      .then( decodedToken => {
        JPS.currentUserUID = decodedToken.sub;
        console.log("User: ", JPS.currentUserUID, " requested checkout.");
        return JPS.firebase.database().ref('/users/'+JPS.currentUserUID).once('value')
      })
      .then ( snapshot => {
        if(snapshot.val() == null){
          throw(new Error("User record does not exist in the database: " + JPS.currentUserUID))
        }
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
        return JPS.firebase.database().ref('/transactions/'+JPS.currentUserUID).once('value')
      })
      .then( snapshot => {
        JPS.allTx = snapshot.val();
        for (JPS.one in JPS.allTx){
          switch(JPS.allTx[JPS.one].type){
            case "time":
              if(JPS.allTx[JPS.one].expires > JPS.now){
                    JPS.userHasTime = true;
              }
              break;
            case "count":
              if((JPS.allTx[JPS.one].expires > JPS.now) && (JPS.allTx[JPS.one].unusedtimes > 0)){
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
              break;
          }
        } // for - looping through transactions
        JPS.transactionReference = 0; //Leave it 0 if bookign is based on time-token.
        if(!JPS.userHasTime){
          console.log("User does not have time.");
          if(!JPS.userHasCount){
            console.log("User does not have count");
            throw( new Error("User is not entitled to book this slot"));
          }
          else { //Process user has count option
            JPS.transactionReference = JPS.earliestToExpire;
            //TODO: Check tahat user has not already booked in to the course before reducing count.
            JPS.recordToUpdate.unusedtimes = JPS.recordToUpdate.unusedtimes - 1;
            JPS.unusedtimes = JPS.unusedtimes - 1;
            JPS.firebase.database()
              .ref('/transactions/'+JPS.currentUserUID+'/'+JPS.earliestToExpire)
              .update({unusedtimes: JPS.unusedtimes})
              .then( err => {
                if(err){
                  throw(new Error(err.message + " " + err.code));
                } else {
                  console.log("Updated transaction date for user: ", JPS.currentUserUID);
                }
              })
              .catch(err => {throw(err)})
            }
          } else {
          console.log("User has time.");
          }
          //If user is entitled, write the bookings in to the database
          if(JPS.userHasTime || JPS.userHasCount){
            JPS.courseTime = JPS.timeHelper.getCourseTimeGMT(JPS.weeksForward, JPS.courseInfo.start, JPS.courseInfo.day)
            JPS.bookingTime = JPS.courseTime.getTime();
            JPS.firebase.database().ref('/bookingsbycourse/'+JPS.courseInfo.key+'/'+JPS.bookingTime+'/'+JPS.user.key)
            .update({
              user: (JPS.user.alias)? JPS.user.alias : JPS.user.firstname + " " + JPS.user.lastname,
              transactionReference: JPS.transactionReference,
              courseName: JPS.courseInfo.courseType.name,
              courseTime: JPS.bookingTime
            })
            .then( err => {
              if(err){
                console.error("Booking by COURSE write to firabase failed: ", err);
                throw(new Error("Booking by COURSE write to firabase failed: " + err.toString()))
              }
              return JPS.firebase.database().ref('/bookingsbyuser/'+JPS.user.key+'/'+JPS.courseInfo.key+'/'+JPS.bookingTime)
              .update({ 
                transactionReference: JPS.transactionReference,
                courseName: JPS.courseInfo.courseType.name,
                courseTime: JPS.bookingTime
              })
            })
            .then( err => {
              if(err){
                console.error("Booking by USER write to firabase failed: ", err);
                throw(new Error("Booking by USER write to firabase failed: " + err.toString()))
              }
              else{
                //======================================
                res.status(200).jsonp({context: "Booking done succesfully" }).end();
                JPS.mailer.sendConfirmation(JPS.user.email, JPS.courseInfo, JPS.courseTime); //Send confirmation email
                //======================================
              }
            })
            .catch( err => {
              throw(err)
            })
          }
      })
      .catch( err => {
        console.error("Reserve slot failed: ", err);
        res.status(500).jsonp({context: "Reserve slot failed"}).end(err);
      })
    })
  })
}
