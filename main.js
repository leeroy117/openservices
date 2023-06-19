var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var moment = require('moment');
global.mysql = require('mysql2');
require('./herramientas/connectionBD');
global.SSH2client = require('ssh2').Client;
const cors = require('cors');
const Openpay = require('openpay');
const { body, validationResult, check } = require('express-validator');
const { sendMailTest } = require('./herramientas/emails/emails');
const { insertVerificationCode, getVerificationCodes, registrarPagoCash, actualizarPagoCash } = require("./model/pagosServiciosModel");


var usuarios = [];

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// var openpay = new Openpay('mbipwocgkvgkndoykdgg', 'sk_252732b74920457099f62651857894ef', false);
const dashboardopenpay = 'https://sandbox-dashboard.openpay.mx';
// const bussinesid = 'mbipwocgkvgkndoykdgg';
// const privateKey = 'sk_252732b74920457099f62651857894ef';
const bussinesid = 'm8qrwxynurdz6r7m9p4i';
const privateKey = 'sk_bd7bceeb812e45e8b79d579da88da702';
var openpay = new Openpay(bussinesid, privateKey, false);

app.get("/hello", function(req, res) {
    res.status(200).send("Hello World!");
});

app.use("/api/v1/pasarela", require('./routes/pagosServiciosRouter'));

app.post('/api/v1/charge/card',
body('source_id').notEmpty().withMessage('El campo source_id es necesario'),
(req, res) => {
    console.log('entro');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    } 

    try {
        openpay.charges.create(req?.body, (error, body, response) => {

            if (error) {
                return res.status(error?.http_code).json({
                    error_code: error?.http_code,
                    description: error?.description
                });
            }

            const response_body = response?.body;

            if (body?.status === 'completed') {
                sendMailTest(response_body?.amount, response_body?.id, null, 1);
            }

            return res.status(201).json(response_body);


        });
    } catch (error) {
        console.log('___error__', error);
        return res.status(500).json({
            error_code: 500,
            description: 'Ocurrio un error en el servidor.'
        });
    }

});

app.post('/api/v1/charge/store', function (req, res) {
    // console.log(req);
    if (req?.body?.customerid) {
        try {
            openpay.customers.charges.create(req?.body?.customerid, req?.body?.data, function (error, body, response) {
                // if (error) {
                //     res.statusCode = error?.http_code;
                //     res.setHeader('Content-Type', 'application/json');
                //     res.end(JSON.stringify({
                //         "error_code": error?.http_code,
                //         "description": error?.description
                //     }));
                // } else if (response) {
                //     const body = response?.body;
                //     res.statusCode = 201;
                //     res.setHeader('Content-Type', 'application/json');
                //     res.end(JSON.stringify(body));
                // }
                console.log('body', body);
                console.log('error', error);
    
                if (error) {
                    return res.status(error?.http_code).json({
                        error_code: error?.http_code,
                        description: error?.description
                    });
                }

                if (req?.body?.data?.method === 'store')
                    urlpdf = `${dashboardopenpay}/paynet-pdf/${bussinesid}/${body?.payment_method?.reference}`
                else urlpdf = `${dashboardopenpay}/spei-pdf/${bussinesid}/${body?.id}`
                
                sendMailTest(null, null, urlpdf, 2);
                return res.status(201).json(response?.body);
            });
        } catch (error) {
            console.log('error');
            return res.status(500).json(error);
        }
        
    }
});

app.post('/api/v1/charge/create_customer', function (req, res) {
    if (req?.body) {
        openpay.customers.create(req?.body, function (error, body, response) {
            console.log('body', body);

            if (error) {
                return res.status(error?.http_code).json({
                    error_code: error?.http_code,
                    description: error?.description
                });
            }

            return res.status(201).json(response?.body);
        });
    }
});

app.post('/api/v1/charges/listener', function (req, res) {
    /*
    openpay.webhooks.get('wsdwhuz6spxxkmhm7h7d', function (error, webhook) {
    });
    const body = req?.body;
    console.log('___bodyopenpay___', body);
    if(body?.verification_code){
        console.log('__codigoverificacion_', body?.verification_code);
    }*/
    const body = req?.body;
    console.log("🚀 ~ file: main.js:144 ~ body:", body);
    if(body?.type === 'charge.succeeded' && body?.transaction?.id){
        const transactioninfo = body?.transaction;
        const obj = {
            status: transactioninfo?.status,
            order_id: transactioninfo?.order_id,
            authorization: transactioninfo?.authorization,
            id: transactioninfo?.id
        }

        actualizarPagoCash(body)
            .then((result) => {
                console.log("🚀 ~ file: main.js:156 ~ .then ~ result:", result);

            })
            .catch((error) => {
                console.log("🚀 ~ file: main.js:160 ~ error:", error)
            });
    console.log('__showobjinfo__', obj);
    }else{
        console.log('__errorbut__', body);
    }
    
    res.end(JSON.stringify({"registro": "ok"}));
});

app.get('/api/v1/charges/get_verification_codes', (req, res) => {
    getVerificationCodes()
        .then((results)=> {
            res.status(200).json(results);
        })
        .catch((error) => {
            res.status(500).json({
                success: false,
                error: error.error
            });
        });
});


io.on("connection", async function(socket) {
    const usuario = socket.handshake.query;
    const id_sesion = socket.id;

    socket.join(usuario.id_moodle);
    console.log("alumno conectado");

    //guarda el inicio de sesion
    if (!usuarios[usuario.id_moodle]) {
        usuarios[usuario.id_moodle] = { id_moodle: usuario.id_moodle, numero_empleado: usuario.numero_empleado, sesiones_activas: [], login: moment().format("YYYY/MM/DD hh:mm:ss") };
    }

    usuarios[usuario.id_moodle].sesiones_activas.push({ login: moment().format("YYYY/MM/DD hh:mm:ss"), tipo: usuario.tipo, id_sesion: id_sesion, ip: usuario.ip, navegador: usuario.navegador, so: usuario.so });

    socket.to(usuario.id_moodle).emit("examenes_activos", usuarios[usuario.id_moodle].sesiones_activas);
    socket.emit("examenes_activos", usuarios[usuario.id_moodle].sesiones_activas);

    socket.on('disconnect', function() {
        let a = '';
        let b = moment().format("YYYY/MM/DD hh:mm:ss");

        for (let [index, log] of usuarios[usuario.id_moodle].sesiones_activas.entries()) {
            if (log.id_sesion == id_sesion) {
                a = log.login
                usuarios[usuario.id_moodle].sesiones_activas.splice(index);

                console.log("alumno desconectado" + usuarios[usuario.id_moodle].sesiones_activas.length);

                if (usuarios[usuario.id_moodle].sesiones_activas.length == 0) {
                    var query = `
                        CALL escolar.sp_setSesion(${usuario.id_moodle},${usuario.id_moodle},${usuario.id_moodle},'${usuario.login}','${b}')
                    `;

                    connection.invokeQuery(query, function(results) {
                        console.log(results)
                    });
                }
            }
        }

    });
});

server.listen(8080, function() {
    console.log("Servidor corriendo en http://localhost:8080");
});