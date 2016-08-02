module.exports = {
    cancelSlot: (JPS, user, courseInfo, courseInstance, transactionReference) => {

      JPS.courseInfo = courseInfo;
      JPS.cancelItem = courseInstance;
      JPS.txRef = transactionReference;
      JPS.timezoneOffset = 0;

      console.log("USER:", user);
      JPS.firebase.database().ref('/bookingsbycourse/' + JPS.courseInfo.key + '/' + JPS.cancelItem + '/' + user).once('value')
      .then(snapshot => {
          if (snapshot.val() == null) {
              throw (new Error("Booking by-COURSE does not exist in the database."))
          }
          return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + JPS.courseInfo.key + '/' + JPS.cancelItem).once('value');
      })
      .then(snapshot => {
          if (snapshot.val() == null) {
              throw (new Error("Booking by-USER does not exist in the database."))
          }
          return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + JPS.courseInfo.key + '/' + JPS.cancelItem).remove();
      })
      .then(() => {
          return JPS.firebase.database().ref('/bookingsbycourse/' + JPS.courseInfo.key + '/' + JPS.cancelItem + '/' + user).remove();
      })
      .then(() => {
          console.log("Transaction reference: ", JPS.txRef)
          if (JPS.txRef != 0) {
              //Give back one use time for the user
              JPS.firebase.database().ref('/transactions/' + user + '/' + JPS.txRef).once('value')
                  .then(snapshot => {
                      if (snapshot.val() == null) {
                          throw (new Error("Transaction not found in the DB: TX:" + user + "/" + JPS.txRef));
                      }
                      JPS.unusedtimes = snapshot.val().unusedtimes;
                      JPS.unusedtimes++;
                      return JPS.firebase.database().ref('/transactions/' + user + '/' + JPS.txRef).update({
                          unusedtimes: JPS.unusedtimes
                      })
                  })
                  .then(err => {
                      if (err) {
                          throw (new Error(err.message + " " + err.code));
                      }
                      JPS.mailer.sendCourseCancellationCount(JPS.user.email, JPS.courseInfo, JPS.cancelItem); //Send confirmation email
                  }).catch(err => {
                      throw (new Error(err.message + " " + err.code));
                  })
          } else {
              JPS.mailer.sendCourseCancellationTime(JPS.user.email, JPS.courseInfo, JPS.cancelItem); //Send confirmation email
          }
      })
      .catch(err => {
          console.error("Cancel Slot failed: ", err);
          return {code: "NOK", message: "cancel slot failed: " + err.toString()}
      });
      return {code: "OK", message: "cancel ok"}
    }
}
