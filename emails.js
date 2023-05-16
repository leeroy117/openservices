"use strict";
const nodemailer = require("nodemailer");

const htmlSucessCard = (total, ref) => {
    const html = `
        <!DOCTYPE html>
            <html>
            <body>

            <table style="width:100%">
            <tr style="background: #2c9a31; height: 300px">
                <th style="color: #fff; font-size: 53px">Pago realizado con éxito</th>
            </tr>
            <tr>
                <td style="height: 300px; font-size: 18px; text-align: center;">
                <h2>Hemos recibido tu pago</h2>
                <p>Total de tu pago: <strong>$${total} MXN</strong></p>
                <p>Número de referencia: <strong>${ref}</strong></p>
                <p>Para cualquier aclaración contacta a <strong>contacto@academiadigital.com</strong></p>
                </td>
            </tr>
            </table>

            </body>
        </html>
    `;

    return html;
}

const htmlSucessCash = (link) => {
    const html = `
            <!DOCTYPE html>
                <html>
                <body>
                
                <table style="width:100%">
                <tr style="background: #03A9F4; height: 300px">
                    <th style="color: #fff; font-size: 53px">Descarga tu folio de pago</th>
                </tr>
                <tr>
                    <td style="height: 300px; font-size: 18px; text-align: center;">
                    <a style="background: #2196F3;
                    color: #fff;
                    padding: 10px 20px;
                    border: 0px;
                    border-radius: 5px;
                    cursor: pointer;"  href="${link}" target="_blank">Link de descarga</a>
                    <p>${link}</p>
                    <p>Para cualquier aclaración contacta a <strong>contacto@academiadigital.com</strong></p>
                                
                    </td>
                </tr>
                </table>
                
                </body>
            </html>
    `;

    return html;
}

// async..await is not allowed in global scope, must use a wrapper
const sendMailTest = async (total, ref, link, type) => {
    //async function sendMailTest() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <ade.cuellar92@gmail.com>', // sender address
        to: "ade.cuellar91@gmail.com", // list of receivers
        subject: "Hello2 ✔", // Subject line
        //text: "Hello world?", // plain text body
        html: type === 1 ? htmlSucessCard(total, ref) : htmlSucessCash(link) //"<b>Hello world?</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
module.exports = { sendMailTest }
//main().catch(console.error);
