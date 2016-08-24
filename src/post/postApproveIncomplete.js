exports.setApp = function(JPS) {

    //######################################################
    // POST: cashbuy, post the item being purchased
    //######################################################
    JPS.app.post('/approveincomplete', (req, res) => {

        JPS.now = Date.now();
        console.log("approveincomplete requested.", JPS.now);
        JPS.body = '';
        req.on('data', (data) => {
            JPS.body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (JPS.body.length > 1e6) req.connection.destroy();
        });
        req.on('end', () => {
            JPS.post = JSON.parse(JPS.body);
            JPS.currentUserToken = JPS.post.current_user;
            JPS.pendingTransactionKey = JPS.post.pending_transaction_id;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
            .then(decodedToken => {
                JPS.currentUserUID = decodedToken.sub;
                console.log("User: ", JPS.currentUserUID, " requested approveincomplete for trx: ", JPS.pendingTransactionKey);
                return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
            })
            .then(snapshot => {
                JPS.user = snapshot.val()
                JPS.user.key = snapshot.key;
                return JPS.pendingTransactionsHelper.completePendingTransaction(JPS, JPS.pendingTransactionKey, JPS.user.lastname, "Invoice", null)
            })
            .then( status => {
                console.log("Status from completing pending transaction: ", status);
                res.status(200).end();
            })
            }).catch(err => {
                console.error("approveincomplete failde: ", err);
                res.status(500).jsonp("approveincomplete failde." + String(err)).end(err);
            });
        })
}