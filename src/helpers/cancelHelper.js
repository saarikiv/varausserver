module.exports = {
    cancelSlot: (JPS, user, courseInfo, courseInstance, transactionReference) => {

        var promise = new Promise((resolve, reject) => {

            console.log("USER:", user);
            JPS.firebase.database().ref('/bookingsbycourse/' + courseInfo.key + '/' + courseInstance + '/' + user).once('value')
            .then(snapshot => {
                if (snapshot.val() == null) {
                    throw (new Error("Booking by-COURSE does not exist in the database."))
                }
                return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + courseInfo.key + '/' + courseInstance).once('value');
            })
            .then(snapshot => {
                if (snapshot.val() == null) {
                    throw (new Error("Booking by-USER does not exist in the database."))
                }
                return JPS.firebase.database().ref('/bookingsbyuser/' + user + '/' + courseInfo.key + '/' + courseInstance).remove();
            })
            .then(() => {
                return JPS.firebase.database().ref('/bookingsbycourse/' + courseInfo.key + '/' + courseInstance + '/' + user).remove();
            })
            .then(() => {
                console.log("Transaction reference: ", transactionReference)
                if (transactionReference != 0) {
                    //Give back one use time for the user
                    JPS.firebase.database().ref('/transactions/' + user + '/' + transactionReference).once('value')
                        .then(snapshot => {
                            if (snapshot.val() == null) {
                                throw (new Error("Transaction not found in the DB: TX:" + user + "/" + transactionReference));
                            }
                            JPS.unusedtimes = snapshot.val().unusedtimes;
                            JPS.unusedtimes++;
                            return JPS.firebase.database().ref('/transactions/' + user + '/' + transactionReference).update({
                                unusedtimes: JPS.unusedtimes
                            })
                        })
                        .then(err => {
                            if (err) {
                                throw (new Error(err.message + " " + err.code));
                            }
                            JPS.mailer.sendCourseCancellationCount(JPS.user.email, courseInfo, courseInstance); //Send confirmation email
                        }).catch(err => {
                            throw (new Error(err.message + " " + err.code));
                        })
                } else {
                    JPS.mailer.sendCourseCancellationTime(JPS.user.email, courseInfo, courseInstance); //Send confirmation email
                }
            })
            .catch(err => {
                console.error("Cancel Slot failed: ", err);
                reject( "cancel slot failed: " + err.toString() );
            });
            resolve()
        })
        return promise;
    }
}
