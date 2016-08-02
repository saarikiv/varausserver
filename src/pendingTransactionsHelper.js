
module.exports = {


    completePendingTransaction: (JPS, pendingTransactionKey, externalReference, paymentInstrumentType, paymentMethod) => {
        // Let's get the transaction at hand.
        JPS.firebase.database().ref('/pendingtransactions/' + pendingTransactionKey).once('value')
        .then(snapshot => {
            if(snapshot.val() !== null){
                JPS.pendingTransaction = snapshot.val()
                console.log("Processing pending transaction: ", JPS.pendingTransaction)
                JPS.dataToUpdate = Object.assign(
                    JPS.pendingTransaction.transaction, 
                    JPS.pendingTransaction.shopItem, {
                    details: {
                        success: true,
                        transaction: {
                            pendingTransaction: pendingTransactionKey,
                            amount: JPS.pendingTransaction.shopItem.price,
                            currencyIsoCode: "EUR",
                            id: externalReference,
                            paymentInstrumentType: paymentInstrumentType,
                            paymentMethod: paymentMethod
                        }
                    }
                })
                return JPS.firebase.database().ref('/transactions/'+JPS.pendingTransaction.user+'/'+JPS.pendingTransaction.timestamp)
                .update(JPS.dataToUpdate)                    
            }
            throw( new Error("PendingTransactionHelper: Pending transaction was not found: " + pendingTransactionKey))
        }).then(() => {
            console.log("Pending transaction processed succesfully. Removing pending record.");
            return JPS.firebase.database().ref('/pendingtransactions/'+pendingTransactionKey).remove();
        }).then(() => {
            console.log("Pending record removed successfully.");
            if(JPS.pendingTransaction.shopItem.type === "special"){
                JPS.firebase.database().ref('/scbookingsbycourse/' + JPS.pendingTransaction.transaction.shopItemKey + '/' + JPS.pendingTransaction.user)
                .update({transactionReference: JPS.paymentTransactionRef, shopItem: JPS.pendingTransaction.shopItem})
                .then(() => {
                    return JPS.firebase.database().ref('/scbookingsbyuser/' + JPS.pendingTransaction.user + '/' + JPS.pendingTransaction.transaction.shopItemKey)
                    .update({transactionReference: JPS.paymentTransactionRef, shopItem: JPS.pendingTransaction.shopItem})
                }).then(()=>{
                    console.log("Updated SC-bookings succesfully");
                    JPS.mailer.sendReceipt(JPS.pendingTransaction.receiptEmail, JPS.dataToUpdate, JPS.pendingTransaction.timestamp);
                })
                .catch(error => {
                    console.error("Processing SC-bookings failed: ", pendingTransactionKey, error);
                    throw(new Error("Processing SC-bookings failed: " + pendingTransactionKey + error.message))
                })
                return {code: 200, message: "OK"};                    
            } else {
                JPS.mailer.sendReceipt(JPS.pendingTransaction.receiptEmail, JPS.dataToUpdate, JPS.pendingTransaction.timestamp);
                return {code: 200, message: "OK"};
            }                  
        }).catch(err => {
            console.error("completePendingTransaction failde: ", err, JPS.pendingTransaction);
            return {code: 500, message: "completePendingTransaction failde: " + err.mesage, err};
        });
    }
}
