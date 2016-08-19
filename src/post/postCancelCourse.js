exports.setApp = function(JPS) {

    //######################################################
    // POST: cancelslot, post the item being purchased
    //######################################################
    JPS.app.post('/cancelslot', (req, res) => {

        JPS.now = Date.now();
        console.log("cancelslot requested.", JPS.now);
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
            JPS.slotInstance = JPS.post.slot_instance;
            JPS.slotInfo = JPS.post.slot_info;
            JPS.reason = JPS.post.reason;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested cancelslot by user: ", JPS.currentUserUID);
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
                        console.log("USER requesting cancelslot is INSTRUCTOR.");
                        return JPS.firebase.database().ref('/cancelledSlots/' + JPS.slotInfo.key + '/' + JPS.slotInstance).update({
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
                        JPS.cancelHelper.cancelSlot(JPS, item.key, JPS.slotInfo, JPS.slotInstance, item.transactionReference)
                        .then(() => {
                            console.log("Slot cancellation OK for user: " + item.key);
                        })
                        .catch(error => {
                            console.error("One slot cancel failed: ", error, item.key, JPS.slotInfo, JPS.slotInstance, item.transactionReference)
                            JPS.firebase.database().ref('/cancelledSlots/' + JPS.slotInfo.key + '/' + JPS.slotInstance + '/failures/' + item.key).update({
                                error: error,
                                transactionReference: item.transactionReference,
                                uid: item.key
                            })
                        })
                    })
                    res.status(200).jsonp("Slot cancelled succesfully.").end();
                }).catch(err => {
                    console.error("cancelslot failde: ", err);
                    res.status(500).jsonp("cancelslot failde." + err.toString()).end(err);
                });
        })
    })
}
