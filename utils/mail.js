const nodemailer = require("nodemailer");

async function sendEmail(mailParameters) {
    
    let transportSettings = {
        host: mailParameters.smtpHost,
        port: mailParameters.smtpPort,
        secure: mailParameters.sendSecure || false, // true for 465, false for other ports
    };

    if( mailParameters.smtpUser !== null && mailParameters.smtpUser !== "" ){
        transportSettings.auth = {
            //type: "LOGIN",
            user: mailParameters.smtpUser,
            pass: mailParameters.smtpPassword
        };
    }

    let transporter = nodemailer.createTransport(transportSettings);

    // setup email data with unicode symbols
    let mailOptions = {
        from: mailParameters.from,
        to: mailParameters.to, // list of receivers
        subject: mailParameters.subject, // Subject line
        html:mailParameters.body,
        attachments: []
    };

    mailParameters.attachments.forEach(att => {
        mailOptions.attachments.push({
            filename: att.fileName,
            content: att.fileContent,
            encoding: "base64"
        });
    });

    if( mailParameters.cc !== "" ){
        mailOptions.cc = mailParameters.cc;
    }

    if( mailParameters.bcc !== "" ){
        mailOptions.bcc = mailParameters.bcc;
     }

    return await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;