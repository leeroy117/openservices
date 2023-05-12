const Express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Openpay = require('openpay');

const app = Express();
app.use(cors());
app.options('*', cors());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var openpay = new Openpay('mbipwocgkvgkndoykdgg', 'sk_252732b74920457099f62651857894ef', false);

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
                    res.end(JSON.stringify({
                        "status_code": response?.statusCode,
                        "data": {
                            "id": body?.id,
                            "authorization": body?.authorization,
                            "operation_type": body?.operation_type,
                            "transaction_type": body?.transaction_type,
                            "status": body?.status,
                            "creation_date": body?.creation_date,
                            "operation_date": body?.operation_date,
                            "description": body?.description,
                            "order_id": body?.order_id
                        }
                    }))
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


app.listen(port, () => console.log(`listening in port ${port}`));