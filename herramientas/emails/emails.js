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
                <p style="font-size:9px;">Para cualquier aclaración contacta a <strong>contacto@academiadigital.com</strong></p>
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
                    <th style="color: #fff; font-size: 53px">Información para tu pago</th>
                </tr>
                <tr>
                    <td style="height: 300px; font-size: 18px; text-align: center;">
                    <a style="background: #2196F3;
                    color: #fff;
                    padding: 10px 20px;
                    border: 0px;
                    border-radius: 5px;
                    cursor: pointer;"  href="${link}" target="_blank">Link de descarga</a>
                    <p><strong>Nota:</strong> Si no puedes dar click en el botón de descarga copia y pega este link:</p>
                    <p style="color:#03A9F4; font-size: 12px;">${link}</p>
                    <p style="font-size:9px;">Para cualquier aclaración contacta a <strong>contacto@academiadigital.com</strong></p>
                                
                    </td>
                </tr>
                </table>
                
                </body>
            </html>
    `;

    return html;
}

const htmlpaymentFailed = () => {
    const html = `
            <!DOCTYPE html>
            <html>
                <body>
                
                <table style="width:100%">
                <tr style="background: #a42d24; height: 300px">
                    <th style="color: #fff; font-size: 53px">Pago no generado</th>
                </tr>
                <tr>
                    <td style="height: 300px; font-size: 18px; text-align: center;">
                    <h2>No se pudo procesar tu pago, favor de intentar nuevamente</h2>
                    <p>Para cualquier aclaración contacta a <strong>contacto@academiadigital.com</strong></p>
                                
                    </td>
                </tr>
                </table>
            
            </body>
            </html>
    `;

    return html;
}

const getSubject = (type) => {
    switch (type) {
        case 1:
            return 'Academia global, pago generado'
        case 2:
            return 'Academia global, referencia de pago'
        case 3:
            return 'Academia global, error al general el pago'

        default:
            break;
    }
}

// async..await is not allowed in global scope, must use a wrapper
const sendMailTest = async (total, ref, link, type, email) => {
    //async function sendMailTest() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            // user: testAccount.user, // generated ethereal user
            // pass: testAccount.pass, // generated ethereal password
            user: 'dt_pagos@academiaglobal.mx',
            pass: 'Agcollege2023+'
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '<dt_pagos@academiaglobal.mx>', // sender address
        to: ["ade.cuellar91@gmail.com","leeroy.garcia@aggroup.com.mx", email], // list of receivers
        subject: getSubject(type), // Subject line
        //text: "Hello world?", // plain text body
        html: type === 1 ? htmlSucessCard(total, ref) : type === 2 ? htmlSucessCash(link) : htmlpaymentFailed() //"<b>Hello world?</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
module.exports = { sendMailTest }
//main().catch(console.error);
