
var JPSM = {}
JPSM.Mailgun = require('mailgun-js')
JPSM.mg_api_key = 'key-4230707292ae718f00a8274d41beb7f3';
JPSM.mg_domain = 'sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.mg_from_who = 'postmaster@sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.initialized = false;

module.exports = {

  initializeMail: () => {
    if(!JPSM.initialized){
      JPSM.mailgun = new JPSM.Mailgun({apiKey: JPSM.mg_api_key, domain: JPSM.mg_domain});
    }
    JPSM.initialized = true;
  },

  sendConfirmation: (sendTo, courseInfo, courseTime) => {
    if(!JPSM.initialized) return;
    JPSM.data = {
      from: JPSM.mg_from_who,
      to: sendTo,
      subject: 'Varausvahvistus:' + courseTime.toString() + ' - Joogakoulu Silta',
      html: 'Kiitos varauksesta ajalle: ' + courseTime.toString() + JSON.stringify(courseInfo)
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
    if(!JPSM.initialized) return;
    var day = new Date()
    day.setTime(courseTimeMs)
    JPSM.data = {
      from: JPSM.mg_from_who,
      to: sendTo,
      subject: 'Peruutusvahvistus:' + day.toString() + ' - Joogakoulu Silta',
      html: 'Palautimme kertalipun. Kiitos peruutuksesta kurssille, aika: ' + day.toString() + ' Kurssi: ' + JSON.stringify(courseInfo)
    }
    console.log("4");
      JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
        if (err) {
            console.error("MAILGUN-error: ", err);
        } else {
          console.log("CANCEL-SENT: ", body);
        }
    });
  },

  sendCancellationTime: (sendTo, courseInfo, courseTimeMs) => {
    if(!JPSM.initialized) return;
    var day = new Date()
    day.setTime(courseTimeMs)
    JPSM.data = {
      from: JPSM.mg_from_who,
      to: sendTo,
      subject: 'Peruutusvahvistus:' + day.toString() + ' - Joogakoulu Silta',
      html: 'Kiitos peruutuksesta kurssille, aika: ' + day.toString() + ' Kurssi: ' + JSON.stringify(courseInfo)
    }
      JPSM.mailgun.messages().send(JPSM.data, (err, body) => {
        if (err) {
            console.error("MAILGUN-error: ", err);
        } else {
          console.log("CANCEL-SENT: ", body);
        }
    });
  },

  sendReceipt: (sendTo, transaction) => {
    if(!JPSM.initialized) return;
    JPSM.data = {
      from: JPSM.mg_from_who,
      to: sendTo,
      subject: 'Ostovahvistus, Joogakoulu Silta',
      html: 'Kiitos ostosta.' + JSON.stringify(transaction)
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
