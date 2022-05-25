const express = require("express");
const router = express.Router();
const Joi = require("joi");
const randomize = require("randomatic");

const encryptPdf = require("../utils/pdf");
const { sendSms } = require("../utils/sms");
const sendEmail = require("../utils/mail");

//Only post is supported
router.post("/", async (req, res) => {
  const { error } = validatePayslipRequest(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  let serviceResult = {
    smsSendSuccess: false,
    smsSendError: null,
    smsResultId: null,
    encryptionSuccess: false,
    encryptionError: null,
    emailSendSuccess: false,
    emailSendError: null,
    emailResultId: null,
    errorMessage: null,
  };

  //--Generate phrase and the reference
  let referenceId = createReferenceId();
  let passPhrase = createPassPhrase();

  //--Send SMS

  let smsMessage = composeSmsMessage(referenceId, passPhrase);
  let smsResult = await sendSms(req.body.phoneNumber, smsMessage);
  if (smsResult.result.status !== 200) {
    serviceResult.smsSendSuccess = false;
    serviceResult.smsSendError = smsResult.result.data;
    serviceResult.errorMessage =
      "SMS gönderiminde hata:" + serviceResult.smsSendError;

    return res.status(500).json(serviceResult);
  } else {
    serviceResult.smsSendSuccess = true;
    serviceResult.smsSendError = null;
    serviceResult.smsResultId = smsResult.result.data.ResponseMessage;
  }

  //--Encrypt pdf
  let encryptionResult = await encryptPdf(req.body.payslipBase64, passPhrase);
  if (encryptionResult.error) {
    serviceResult.encryptionSuccess = false;
    serviceResult.encryptionError = encryptionResult.errorDetail;
    serviceResult.errorMessage = "PDF şifreleme sırasında hata oluştu";
    return res.status(500).json(serviceResult);
  } else {
    serviceResult.encryptionSuccess = true;
    serviceResult.encryptionError = null;
  }

  //--Send mail
  let mailParameters = setMailParameters(
    req.body.mailTo,
    req.body.recipientName,
    req.body.payrollTerm,
    req.body.phoneNumber,
    referenceId,
    encryptionResult.encryptedFile
  );
  let mailResult = await sendEmail(mailParameters);

  if (mailResult.messageId) {
    serviceResult.emailSendSuccess = true;
    serviceResult.emailSendError = null;
    serviceResult.emailResultId = mailResult.messageId;
  } else {
    serviceResult.emailSendSuccess = false;
    serviceResult.emailSendError = mailResult;
    serviceResult.emailResultId = null;
    serviceResult.errorMessage = "E-posta gönderilemedi";
    return res.status(500).json(serviceResult);
  }

  res.json(serviceResult);
});

//Not supported return 405
router.get("/", async (req, res) => {
  return res.status(405).send("GET not supported!");
});

router.get("/:id", async (req, res) => {
  return res.status(405).send("GET not supported!");
});

router.put("/:id", async (req, res) => {
  return res.status(405).send("PUT not supported!");
});

function createReferenceId() {
  let referenceId = randomize("A", 2) + randomize("0", 4) + randomize("A", 2);

  return referenceId;
}

function createPassPhrase() {
  let passPhrase = randomize("0", 6);

  return passPhrase;
}

function composeSmsMessage(referenceId, passPhrase) {
  return `${referenceId} referans kodu ile gönderilen e-bordro şifreniz: ${passPhrase}`;
}
function composeMailBody(recipientName, payrollTerm, phoneNumber, referenceId) {
  let mailBody =
    `<!DOCTYPE html>` +
    `<html>` +
    `<head>` +
    `<meta charset="UTF-8">` +
    `<meta name="description" content="e-Bordro">` +
    `<meta name="author" content="SMOD Business Solutions">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">` +
    `</head>` +
    `<body style="font-size:15px;">` +
    `<p>Sayın <b>${recipientName}</b>,</p>` +
    `<p>${payrollTerm} dönemine ait e-bordronuz ekte iletilmiştir. </p>` +
    `<p>E-bordronuzu görüntüleyebilmek için kullanmanız gereken <em><b>anlık şifreniz</b></em>, son 4 hanesi <b>${phoneNumber.substr(
      phoneNumber.length - 4
    )}</b> ` +
    ` olan telefonunuza, <b>${referenceId}</b> referans kodu ile gönderilmiştir.` +
    `</p>` +
    `<p>Saygılarımızla,<br>İnsan Kaynakları</p>` +
    `</body>` +
    `</html>`;

  return mailBody;
}
function composeMailSubject(payrollTerm) {
  return `${payrollTerm} Dönemi E-bordro`;
}

function setMailParameters(
  mailTo,
  recipientName,
  payrollTerm,
  phoneNumber,
  referenceId,
  encryptedFile
) {
  let mailParameters = {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    sendSecure: process.env.SMTP_SECURE || false,
    smtpUser: process.env.SMTP_USER || null,
    smtpPassword: process.env.SMTP_PASSWORD || null,
    from: process.env.SENDER_ADDRESS,
    to: mailTo,
    cc: null,
    bcc: null,
    subject: composeMailSubject(payrollTerm),
    body: composeMailBody(recipientName, payrollTerm, phoneNumber, referenceId),
    attachments: [
      {
        fileName: `${payrollTerm}_eBordo.pdf`,
        fileContent: encryptedFile,
      },
    ],
  };
  return mailParameters;
}

function validatePayslipRequest(request) {
  let schema = Joi.object({
    phoneNumber: Joi.string().required(),
    mailTo: Joi.string().required().email(),
    payslipBase64: Joi.string().required(),
    payrollTerm: Joi.string().required(),
    recipientName: Joi.string().required(),
  });

  return schema.validate(request);
}

module.exports = router;
