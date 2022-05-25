const pdftk = require("node-pdftk");

async function encryptPDF(sBase64, sPassword){
    //Encrypt pdf file
    const result = await pdftk
        .input(new Buffer.from(sBase64, 'base64'))
        .encrypt128Bit()
        .userPw(sPassword)
        .output()
        .then(encPdfBuffer => {
            return {
                "error": false,
                "encryptedFile": encPdfBuffer.toString("base64"),
                "errorDetail": null
            };
        })
        .catch(err => {
            return {
                "error": true,
                "encryptedFile": null,
                "errorDetail": err
            };
        });
    return result;
}

module.exports = encryptPDF;