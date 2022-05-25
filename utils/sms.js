const axios = require("axios");
const randomize = require("randomatic");

async function sendSms(sPhone, sMessage) {
  let sMessageId = createMessageId();

  // let data = JSON.stringify({
  //   user: process.env.JETSMS_USERNAME,
  //   password: process.env.JETSMS_PASSWORD,
  //   originator: process.env.JETSMS_ORIGINATOR,
  //   reference: "",
  //   startdate: "",
  //   expiredate: "",
  //   exclusionstarttime: "",
  //   exclusionexpiretime: "",
  //   broadcastmessage: "",
  //   smsmessages: [
  //     { messagetext: sMessage, receipent: sPhone, messageid: sMessageId },
  //   ],
  //   channel: process.env.JETSMS_CHANNEL,
  //   recipienttype: "BIREYSEL",
  // });

  let payload =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<mainbody>` +
    `<header>` +
    `<company dil="TR">${process.env.SMS_COMPANY}</company>` +
    `<usercode>${process.env.SMS_USERNAME}</usercode>` +
    `<password>${process.env.SMS_PASSWORD}</password>` +
    `<type>1:n</type>` +
    `<msgheader>${process.env.SMS_ORIGINATOR}</msgheader>` +
    `</header>` +
    `<body>` +
    `<msg>` +
    `<![CDATA[${sMessage}]]>` +
    `</msg>` +
    `<no>${sPhone}</no>` +
    `</body>` +
    `</mainbody>`;

  const config = {
    method: "post",
    url: process.env.SMS_API_URL,
    headers: {
      "Content-Type": "application/xml",
    },
    data: payload,
  };

  try {
    const resp = await axios(config);

    const smsResponse = resp.data.split(" ");

    if (smsResponse[0] === "00" && smsResponse[1] !== null) {
      return {
        error: false,
        errorDetail: null,
        result: smsResponse[1],
      };
    } else {
      return {
        error: true,
        errorDetail: resp.data,
        result: `Hata kodu: ${resp.data}`,
      };
    }

    //console.log("Send SMS success")
  } catch (err) {
    return {
      error: true,
      errorDetail: err.response,
      result: err.response,
    };
  }
}

function createMessageId() {
  let messageId =
    "EPY_" + randomize("A", 2) + randomize("0", 6) + randomize("A", 2);

  return messageId;
}

// async function checkSmsCreditBalance() {
//   let payload = JSON.stringify({
//     user: process.env.JETSMS_USERNAME,
//     password: process.env.JETSMS_PASSWORD,
//     channel: process.env.JETSMS_CHANNEL,
//   });

//   const config = {
//     method: "post",
//     url: "https://ws.jetsms.com.tr/api/reportquota",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     data: payload,
//   };

//   try {
//     const resp = await axios(config);
//     // console.log("Check Credit success")
//     if (resp.status === 200) {
//       return {
//         error: false,
//         errorDetail: null,
//         result: resp.data,
//       };
//     } else {
//       return {
//         error: true,
//         errorDetail: resp.data,
//         result: null,
//       };
//     }
//   } catch (err) {
//     return {
//       error: true,
//       errorDetail: err,
//       result: null,
//     };
//   }
// }

module.exports = {
  sendSms,
};
