const Express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Openpay = require('openpay');
const { sendMailTest } = require('./emails.js')

const app = Express();
app.use(cors());
app.options('*', cors());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const dashboardopenpay = 'https://sandbox-dashboard.openpay.mx';
const bussinesid = 'mbipwocgkvgkndoykdgg';
const privateKey = 'sk_252732b74920457099f62651857894ef';
var openpay = new Openpay(bussinesid, privateKey, false);

const port = 8080;

app.post('/api/v1/charge/card', function (req, res) {
    if (req?.body?.source_id) {
        try {
            openpay.charges.create(req?.body, function (error, body, response) {
                if (error) {
                    res.statusCode = error?.http_code;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        "error_code": error?.http_code,
                        "description": error?.description
                    }));
                } else if (response) {
                    const body = response?.body;
                    res.statusCode = 201;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(body));
                    if (body?.status === 'completed') {
                        sendMailTest(body?.amount, body?.order_id, null, 1);
                    }
                }
            });
        } catch (error) {
            console.log('___error__', error)
        }

    }
});

app.post('/api/v1/charge/store', function (req, res) {
    if (req?.body?.customerid) {
        openpay.customers.charges.create(req?.body?.customerid, req?.body?.data, function (error, body, response) {
            if (error) {
                res.statusCode = error?.http_code;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    "error_code": error?.http_code,
                    "description": error?.description
                }));
            } else if (response) {
                const body = response?.body;
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));
                let urlpdf = ''
                if (req?.body?.data?.method === 'store')
                    urlpdf = `${dashboardopenpay}/paynet-pdf/${bussinesid}/${body?.payment_method?.reference}`
                else urlpdf = `${dashboardopenpay}/spei-pdf/${bussinesid}/${body?.id}`

                sendMailTest(null, null, urlpdf, 2);
            }
        });
    }
});

app.post('/api/v1/charge/create_customer', function (req, res) {
    if (req?.body) {
        openpay.customers.create(req?.body, function (error, body, response) {
            if (error) {
                res.statusCode = error?.http_code;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    "error_code": error?.http_code,
                    "description": error?.description
                }));
            } else if (response) {
                const body = response?.body;
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));

            }
        });
    }
});

app.post('/api/v1/charges/listener', function (req, res) {
    /*openpay.webhooks.get('wxvanstudf4ssme8khmc', function (error, webhook) {
        
    });*/
    res.end(JSON.stringify({"registro": "ok"}));
});


app.listen(port, () => console.log(`listening in port ${port}`));