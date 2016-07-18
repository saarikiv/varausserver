var JPSM = {}
JPSM.Mailgun = require('mailgun-js')
JPSM.mg_api_key = 'key-4230707292ae718f00a8274d41beb7f3';
JPSM.mg_domain = 'sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.mg_from_who = 'postmaster@sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.initialized = false;

module.exports = {

    initializeMail: (jps) => {
        if (!JPSM.initialized) {
            JPSM.jps = jps;
            JPSM.mailgun = new JPSM.Mailgun({
                apiKey: JPSM.mg_api_key,
                domain: JPSM.mg_domain
            });
        }
        JPSM.initialized = true;
    },

    sendConfirmation: (sendTo, courseInfo, courseTime) => {
        if (!JPSM.initialized) return;

        console.log("sendConfirmation")
        console.log(sendTo)
        console.log(courseInfo)
        console.log(courseTime)

        JPSM.html =
            "<h1>Varauksen vahvistus</h1>" +
            "<p>Varauksesi kurssille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
            "<p>Kurssipäivä: " + JPSM.jps.timeHelper.getDayStr(courseTime) + "</p>" +
            "<p>Kurssiaika: " + JPSM.jps.timeHelper.getTimeStr(courseTime) + "</p>" +
            "<br></br>" +
            "<p>Mikäli et pääse osallistumaan kurssille voit perua ilmoittautumisesi vielä edellisenä päivänä.</p>" +
            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

        console.log("CONFIRMATION: ", JPSM.html)

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Varausvahvistus:' + courseTime.toString() + ' - Joogakoulu Silta',
            html: JPSM.html
        }
        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("MAIL-SENT: ", body);
            }
        });
    },

    sendCancellationCount: (sendTo, courseInfo, courseTimeMs) => {
        if (!JPSM.initialized) return;
        var day = new Date()
        day.setTime(courseTimeMs)
        console.log("sendCancellationCount")
        console.log(courseTimeMs)

        JPSM.html =
            "<h1>Peruutuksen vahvistus</h1>" +
            "<p>Peruutuksesi kurssille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
            "<p>Kurssipäivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Kurssiaika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Kertalippusi on palautettu tilillesi.</p>" +
            "<p>Terve tuloa jonain toisena ajankohtana.</p>" +
            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Peruutusvahvistus:' + day.toString() + ' - Joogakoulu Silta',
            html: JPSM.html
        }
        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("CANCEL-SENT: ", body);
            }
        });
    },

    sendCancellationTime: (sendTo, courseInfo, courseTimeMs) => {
        if (!JPSM.initialized) return;
        var day = new Date()
        day.setTime(courseTimeMs)
        console.log("sendCancellationTime")
        console.log(courseTimeMs)

        JPSM.html =
            "<h1>Peruutuksen vahvistus</h1>" +
            "<p>Peruutuksesi kurssille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
            "<p>Kurssipäivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Kurssiaika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Terve tuloa jonain toisena ajankohtana.</p>" +
            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Peruutusvahvistus:' + day.toString() + ' - Joogakoulu Silta',
            html: JPSM.html
        }
        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("CANCEL-SENT: ", body);
            }
        });
    },

    sendReceipt: (sendTo, trx, trxId) => {
        if (!JPSM.initialized) return;

        console.log("sendReceipt")
        console.log(trx.title)
        var expires = new Date();
        expires.setTime(trx.expires);

        JPSM.html =
            "<h1>Ostokuitti</h1>" +
            "<br></br>" +
            "<p>Tuote: " + trx.title + "</p>" +
            "<p>Tuotekuvaus: " + trx.desc + "</p>" +
            "<p>Voimassaolo loppuu: " + JPSM.jps.timeHelper.getDayStr(expires) + "</p>" +
            "<p>Veroton hinta: " + trx.beforetax + " " + trx.details.transaction.currencyIsoCode + "</p>" +
            "<p>ALV(" + trx.taxpercent + ")     : " + trx.taxamount + " " + trx.details.transaction.currencyIsoCode + "</p>" +
            "<p>Yhteensä     : " + trx.price + " " + trx.details.transaction.currencyIsoCode + "</p>" +
            "<br></br>" +
            "<p>Ostotunniste: " + trxId + "</p>" +
            "<p>Maksupalvelutunniste: " + trx.details.transaction.id + "</p>" +
            "<p>Maksutapa: " + trx.details.transaction.paymentInstrumentType + "</p>" +
            "<br></br>" +
            "<p>Y-tunnus: Y-32487984</p>" +
            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Ostokuitti, Joogakoulu Silta',
            html: JPSM.html
        }
        JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
            if (err) {
                console.error("MAILGUN-RECEIPT-error: ", err);
            } else {
                console.log("RECEIPT-SENT: ", body);
            }
        });
    }


}
