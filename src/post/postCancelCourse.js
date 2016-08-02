exports.setApp = function(JPS) {

    //######################################################
    // POST: cancelcourse, post the item being purchased
    //######################################################
    JPS.app.post('/cancelcourse', (req, res) => {

        JPS.now = Date.now();
        console.log("cancelcourse requested.", JPS.now);
        JPS.body = '';
        req.on('data', (data) => {
            JPS.body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (JPS.body.length > 1e6) req.connection.destroy();
        });
        req.on('end', () => {
            JPS.post = JSON.parse(JPS.body);
            JPS.participants = JPS.post.participant_list;
            JPS.currentUserToken = JPS.post.current_user;
            JPS.courseInstance = JPS.post.course_instance;
            JPS.courseInfo = JPS.post.course_info;
            JPS.reason = JPS.post.reason;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested cancelcourse by user: ", JPS.currentUserUID);
                    return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
                })
                .then(snapshot => {
                    if(snapshot.val() != null){
                      JPS.user = snapshot.val()
                      JPS.user.key = snapshot.key;
                      return JPS.firebase.database().ref('/specialUsers/' + JPS.currentUserUID).once('value');
                    } else {
                      throw (new Error("User record does not exist in the database: " + JPS.currentUserUID))
                    }
                })
                .then(snapshot => {
                    JPS.specialUser = snapshot.val()
                    if (JPS.specialUser.instructor) {
                        console.log("USER requesting cancelcourse is INSTRUCTOR.");
                        return JPS.firebase.database().ref('/cancelledCourses/' + JPS.courseInfo.key + '/' + JPS.courseInstance).update({
                          user: JPS.currentUserUID,
                          reason: JPS.reason,
                          time: JPS.now
                        })
                    }
                    throw (new Error("Non instructor user requesting cashbuy."))
                })
                .then(() => {
                    console.log("Process participants: ", JPS.participants);
                    JPS.participants.forEach((item) => {
                      console.log("Processing: ", item);
                        JPS.error = JPS.cancelHelper.cancelSlot(JPS, item.key, JPS.courseInfo, JPS.courseInstance, item.transactionReference)
                        console.log("CANCELSLOT: ", JPS.error);
                        if (JPS.error.code !== "OK") {
                            console.error("One slot cancel failed: ", item.key, JPS.courseInfo, JPS.courseInstance, item.transactionReference)
                            JPS.firebase.database().ref('/cancelledCourses/' + JPS.courseInfo.key + '/' + JPS.courseInstance + '/failures/' + item.key).update({
                                error: JPS.error.message,
                                transactionReference: item.transactionReference,
                                uid: item.key
                            })
                        }
                    })
                    res.status(200).jsonp({ message: "Course cancelled succesfully." }).end();
                }).catch(err => {
                    console.error("cancelcourse failde: ", err);
                    res.status(500).jsonp({
                        message: "cancelcourse failde." + err.toString()
                    }).end(err);
                });
        })
    })
}
