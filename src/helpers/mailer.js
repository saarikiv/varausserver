var JPSM = {}
JPSM.Mailgun = require('mailgun-js')
JPSM.mg_api_key = process.env.MAILGUN_API_KEY || 'key-4230707292ae718f00a8274d41beb7f3';
JPSM.mg_domain = process.env.MAILGUN_DOMAIN || 'sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.mg_from_who = process.env.MAILGUN_FROM_WHO || 'postmaster@sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.feedbackMail = process.env.FEEDBACK_ADDRESS || 'tuomo.saarikivi@outlook.com'
JPSM.registrationMail = process.env.REGISTRATION_ADDRESS || 'tuomo.saarikivi@outlook.com'
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

    sendThankyouForFeedback: (user) => {
        if (!JPSM.initialized) return;

        console.log("sendThankyouForFeedback")
        console.log(user)

        JPSM.html =
            "<h1>Kiitos palautteesta!</h1>" +
            "<p>Olemme vastaanottaneet palautteesi ja arvostamme sitä, että käytit aikaasi antaaksesi meille palautetta.</p>" +
            "<p>Teemme kaikkemme, jotta voimme palvella Sinua paremmin tulevaisuudessa.</p>" +
            "<br>" +
            "<p>Ystävällisin terveisin,</p>" +
            "<p>Joogakoulu Silta</p>"
        console.log("Thankyou: ", JPSM.html)

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: user.email,
            subject: 'Kiitos palautteesta!',
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


    sendFeedback: (user, feedback) => {
        if (!JPSM.initialized) return;

        console.log("sendFeedback")
        console.log(user)
        console.log(feedback)

        JPSM.html =
            "<h1>Palaute:</h1>" +
            "<p>"+ feedback +"</p>" +
            "<br>" +
            "<p> Terveisin " + user.email + "</p>"
        console.log("Feedback: ", JPSM.html)

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: JPSM.feedbackMail,
            subject: 'Joogakoulu Silta palaute',
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


    sendRegistration: (user) => {
        if (!JPSM.initialized) return;

        console.log("sendRegistration")
        console.log(user)

        JPSM.html =
            "<h1>Rekisteröinti-ilmoitus:</h1>" +
            "<br>" +
            "<p> Käyttäjä:" + user.email + "</p>" +
            "<br>" +
            "<p> Nimi:" + user.firstname + " " + user.lastname + "</p>" +
            "<br>" +
            "<p> On rekisteröitynyt siltavaraukset.com palveluun.</p>"
        console.log("Registration: ", JPSM.html)

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: JPSM.registrationMail,
            subject: 'Rekisteröinti imoitus',
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


    sendConfirmation: (sendTo, courseInfo, courseTime) => {
        if (!JPSM.initialized) return;

        console.log("sendConfirmation")
        console.log(sendTo)
        console.log(courseInfo)
        console.log(courseTime)

        JPSM.html =
            "<h1>Varauksen vahvistus</h1>" +
            "<p>Varauksesi tunnille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(courseTime) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(courseTime) + "</p>" +
            "<br></br>" +
            "<p>Mikäli et pääse osallistumaan tunnille voit perua ilmoittautumisesi vielä vähintään 3 h ennen tunnin alkamista.</p>" +
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

    sendCourseCancellationCount: (sendTo, courseInfo, courseTimeMs) => {
        if (!JPSM.initialized) return;
        var day = new Date()
        day.setTime(courseTimeMs)
        console.log("sendCourseCancellationCount")
        console.log(courseTimeMs)

        JPSM.html =
            "<h1>Tunti jolle olet ilmoittautunut on peruttu!</h1>" +
            "<p>Tunti " + courseInfo.courseType.name + " on peruttu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Kertalippusi on palautettu tilillesi.</p>" +
            "<p>Tervetuloa jonain toisena ajankohtana!</p>" +
            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Tunnin peruutusilmoitus:' + day.toString() + ' - Joogakoulu Silta',
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

    sendCourseCancellationTime: (sendTo, courseInfo, courseTimeMs) => {
        if (!JPSM.initialized) return;
        var day = new Date()
        day.setTime(courseTimeMs)
        console.log("sendCancellationTime")
        console.log(courseTimeMs)

        JPSM.html =
            "<h1>Tunti jolle olet ilmoittautunut on peruttu!</h1>" +
            "<p>Tunti " + courseInfo.courseType.name + " on peruttu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Tervetuloa jonain toisena ajankohtana!</p>" +
            "<footer><a href=\"https: //joogakoulusilta-projekti.firebaseapp.com\">Joogakoulu Silta</a>, jooga(at)joogasilta.com</footer>"

        JPSM.data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Tunnin peruutusilmoitus:' + day.toString() + ' - Joogakoulu Silta',
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


    sendCancellationCount: (sendTo, courseInfo, courseTimeMs) => {
        if (!JPSM.initialized) return;
        var day = new Date()
        day.setTime(courseTimeMs)
        console.log("sendCancellationCount")
        console.log(courseTimeMs)

        JPSM.html =
            "<h1>Peruutuksen vahvistus</h1>" +
            "<p>Peruutuksesi tunnille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Kertalippusi on palautettu tilillesi.</p>" +
            "<p>Tervetuloa jonain toisena ajankohtana!</p>" +
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
            "<p>Peruutuksesi tunnille " + courseInfo.courseType.name + " on vahvistettu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Tervetuloa jonain toisena ajankohtana!</p>" +
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
            "<h1>Kiitos ostostasi!</h1>" +
            "<p>Voit nyt mennä varaamaan tunteja <a href=\"https://www.siltavaraukset.com\">Joogakoulu Sillan</a> varauspalvelusta.</p>" +
            "<br></br>" +
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
            "<p>Y-tunnus: 2736475-2  ALV-numero: FI27364752</p>" +
            "<footer><a href=\"https://www.siltavaraukset.com\">Joogakoulu Silta</a>, joogakoulusilta@gmail.com</footer>"

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
