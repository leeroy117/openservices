const { asyncQuery } = require("../herramientas/asyncConnection");

const getServicios = ({ pe }) => {
    const sqlQuery = `CALL escolar.sp_pasarela_get_servicios_disponibles(${pe});`;

    return new Promise((resolve, reject) => {
        try {
            connection.invokeQuery(sqlQuery, (res)=>{
                console.log('res', res);
                if (typeof res.errno !== 'undefined') {
                    reject({
                        success: false,
                        message: 'Error al obtener servicios',
                        error: res.code
                    });
                }
    
                resolve({
                    success: true,
                    message: '',
                    data: res[0]
                });
            });
        } catch (error) {
            reject({
                success: false,
                message: '',
                error: error
            })
        }
        
    })
    
}

const registrarPagoCard = (body) => {
    return new Promise(async (resolve, reject) => {
        try {

            const {
                id_moodle_alumno,
                id_plan_estudio,
                id_moodle_materia,
                monto,
                id_servicio,
                status,
                order_id,
                authorization,
                id,
                cardinfo,
                type_payment,
            } = body;
        
            const {
                type,
                brand,
                address,
                card_number,
                holder_name,
                expiration_year,
                expiration_month,
                allows_charges,
                allows_payouts,
                bank_name,
                bank_code
            } = cardinfo;

            console.log('body', body);

            //Checar si el servicio es pago de examen
            const sqlQueryCheckTypeService = `CALL escolar.sp_pasarela_get_info_servicio(${id_servicio})`; 
            const executeQueryCheckTypeService = await asyncQuery(sqlQueryCheckTypeService);
            // console.log("🚀 ~ file: pagosServiciosModel.js:73 ~ returnnewPromise ~ executeQueryCheckTypeService:", executeQueryCheckTypeService)

            if (typeof executeQueryCheckTypeService.errno != 'undefined') {
                reject({
                    success: false,
                    message: 'Error al insertar pago en la base de datos.',
                    error: executeQueryCheckTypeService.code
                });
                return;
            }

            // console.log('information service',executeQueryCheckTypeService[0]);
            // console.log('information service length',executeQueryCheckTypeService[0].length);

            if (executeQueryCheckTypeService[0].length <= 0) {
                resolve({
                    success: true,
                    message: 'No se encontaron resultados',
                    data : null
                });
                return;
            }

            const servicio = executeQueryCheckTypeService[0][0];
            console.log("🚀 ~ file: pagosServiciosModel.js:89 ~ returnnewPromise ~ servicio:", servicio)
            console.log('id_moodle_materia', id_moodle_materia);
            if (servicio.id_tipo == 12 && id_moodle_materia == null) {
                console.log('entro aqui eee');
                resolve({
                    success: false,
                    message: 'El tipo de servicio requiere una materia',
                    data : null
                });
                return;
            }

            //Checar si el servicio es pago de examen

            const sqlQueryPayment = `CALL escolar.sp_insert_pagos_pasarela_card(
                    ${id_moodle_alumno},
                    ${id_plan_estudio},
                    ${id_servicio},
                    ${id_moodle_materia},
                    '${type_payment}',
                    '${authorization}',
                    '${status}',
                    '${id}',
                    ${monto},
                    '${type}',
                    '${brand}',
                    '${address}',
                    '${card_number}',
                    '${holder_name}',
                    '${expiration_year}',
                    '${expiration_month}',
                    ${allows_charges},
                    ${allows_payouts},
                    '${bank_name}',
                    '${bank_code}',
                    '${order_id}'
                );`;

                const responseQueryPaymentCard = await asyncQuery(sqlQueryPayment);

                console.log('repsons_query', responseQueryPaymentCard[0][0]);

                if (typeof responseQueryPaymentCard.errno != 'undefined') {
                    reject({
                        success: false,
                        message: 'Error al insertar pago en la base de datos.',
                        error: responseQueryPaymentCard.code
                    });
                    return;
                }

                if (!responseQueryPaymentCard[0][0].success) {
                    resolve({
                        success: false,
                        message: responseQueryPaymentCard[0][0].message,
                        data : null
                    });
                    return;
                }

                const sqlQueryRegistrarPago = `CALL escolar.sp_pasarela_registrar_pagos(
                    ${id_moodle_alumno},
                    ${id_plan_estudio},
                    ${monto},
                    ${id_servicio});`;

                const responseQueryPayment = await asyncQuery(sqlQueryRegistrarPago);

                console.log('query_payment_query', responseQueryPayment);

                if (typeof responseQueryPayment.errno != 'undefined') {
                    reject({
                        success: false,
                        message: 'Error al insertar pago en la base de datos.',
                        error: responseQueryPayment.code
                    });
                    return;
                }

                if (!responseQueryPayment[0][0].success) {
                    resolve({
                        success: false,
                        message: responseQueryPayment[0][0].message,
                        data : null
                    });
                    return;
                }

                //Pago de extraordinario
                if (id_moodle_materia != null) {
                    console.log('entro aqui en idmoodle materia');
                    const sqlQueryExamPayment = `CALL escolar.sp_pasarela_activar_extraordinario(
                                ${id_plan_estudio},
                                ${id_moodle_alumno},
                                ${id_moodle_materia}
                            );`;

                    const responseQueryExamPayment = await asyncQuery(sqlQueryExamPayment);
                    console.log("🚀 ~ file: pagosServiciosModel.js:147 ~ returnnewPromise ~ responseQueryExamPayment:", responseQueryExamPayment)

                    if (typeof responseQueryExamPayment.errno != 'undefined') {
                        reject({
                            success: false,
                            message: 'Error al insertar pago en la base de datos.',
                            error: responseQueryExamPayment.code
                        });
                        return;
                    }
    
                    if (!responseQueryExamPayment[0][0].success) {
                        resolve({
                            success: false,
                            message: responseQueryExamPayment[0][0].message,
                            data : null
                        });
                        return;
                    }
                }

                resolve({
                    success: true,
                    message: 'Se ha registrado el pago con exito',
                    data: []
                });

                
            } catch (error) {
                console.log('cathc_error', error);
                reject({
                    success: false,
                    message: 'Ocurrio un error al registrar el pago.',
                    error: error
                })
            }
        });
    
}

const registrarPagoCash = (body) => {

    return new Promise(async (resolve, reject) => {

        try {
            const {
                id_moodle_alumno, 
                id_plan_estudio, 
                id_moodle_materia,
                monto, 
                id_servicio, 
                type_payment, 
                status, 
                id,
                authorization,
                order_id
            } = body;

            //Checar si el servicio es pago de examen
            const sqlQueryCheckTypeService = `CALL escolar.sp_pasarela_get_info_servicio(${id_servicio})`; 
            const executeQueryCheckTypeService = await asyncQuery(sqlQueryCheckTypeService);
            // console.log("🚀 ~ file: pagosServiciosModel.js:73 ~ returnnewPromise ~ executeQueryCheckTypeService:", executeQueryCheckTypeService)

            if (typeof executeQueryCheckTypeService.errno != 'undefined') {
                console.log('errorbandera1');
                reject({
                    success: false,
                    message: 'Error al insertar pago en la base de datos.',
                    error: executeQueryCheckTypeService.code
                });
                return;
            }

            // console.log('information service',executeQueryCheckTypeService[0]);
            // console.log('information service length',executeQueryCheckTypeService[0].length);

            if (executeQueryCheckTypeService[0].length <= 0) {
                resolve({
                    success: true,
                    message: 'No se encontaron resultados',
                    data : null
                });
                return;
            }

            const servicio = executeQueryCheckTypeService[0][0];
            console.log("🚀 ~ file: pagosServiciosModel.js:89 ~ returnnewPromise ~ servicio:", servicio)
            console.log('id_moodle_materia', id_moodle_materia);
            if (servicio.id_tipo == 12 && id_moodle_materia == null) {
                console.log('entro aqui eee');
                resolve({
                    success: false,
                    message: 'El tipo de servicio requiere una materia',
                    data : null
                });
                return;
            }

            //Checar si el servicio es pago de examen

            const sqlQueryPaymentLog = `CALL escolar.sp_registrar_pagos_pasarela_cash(
                ${id_moodle_alumno},
                ${id_plan_estudio},
                ${id_servicio},
                ${id_moodle_materia},
                '${type_payment}',
                '${authorization}',
                '${status}',
                '${id}',
                ${monto},
                '${order_id}'
            );`;
            
            const queryPaymentLogResult = await asyncQuery(sqlQueryPaymentLog);
            console.log('resultQuery', queryPaymentLogResult[0]);
            const message = queryPaymentLogResult[0][0].message;

            if (typeof queryPaymentLogResult.errno != 'undefined' ) {
                console.log('error1');
                reject({
                    success: false,
                    message: 'ocurrio un error',
                    error: queryPaymentLogResult.code
                });
            }

            if (queryPaymentLogResult[0][0].success == 0) {
                console.log('si entro aqui');
                resolve({
                    success: false,
                    message: '',
                    data: queryPaymentLogResult[0]
                });
            }

            if (status != 'completed') {
                resolve({
                    success: true,
                    message: '',
                    data: queryPaymentLogResult[0]
                });
            }


        } catch (error) {
            console.log('error', error);
            reject({
                success: false,
                message: 'Ocurrio un error en el servidor.',
                error: error
            });
        } 
    });
}

const actualizarPagoCash = (body) => {

    return new Promise(async (resolve, reject) => {
        
        // const body  = {
        //     type: 'charge.succeeded',
        //     event_date: '2023-06-02T14:33:09-06:00',
        //     transaction: {
        //         id: 'tr8tjvm2n42pza9xvuvs',
        //         authorization: '757257',
        //         operation_type: 'in',
        //         transaction_type: 'charge',
        //         status: 'completed',
        //         conciliated: false,
        //         creation_date: '2023-06-02T13:31:35-06:00',
        //         operation_date: '2023-06-02T14:33:08-06:00',
        //         description: 'CONSTANCIA ESTUDIOS',
        //         error_message: null,
        //         order_id: null,
        //         customer_id: 'apaaqubisd4xeuukiij5',
        //         amount: 105.4,
        //         fee: { amount: 5.5566, tax: 0.8891, currency: 'MXN' },
        //         payment_method: {
        //             type: 'store',
        //             reference: '1010103796002496',
        //             barcode_url: 'https://sandbox-api.openpay.mx/barcode/1010103796002496',
        //             url_store: 'https://sandbox-api.openpay.mx/v1/mbipwocgkvgkndoykdgg/customers/7952650/tru03o50z1jmlgioiexo/store_confirm'
        //         },
        //         currency: 'MXN',
        //         method: 'store'
        //     }
        // };
        
        try {
            const {
                transaction
            } = body;

            const { 
                id,
                authorization,
                status,
                method,
                customer_id
            }= transaction;

            const queryUpdateTransactionStatus = `CALL escolar.sp_pasarela_actualizar_estatus_transaction('${id}','${status}');`;
            const executeStatementUpdate = await asyncQuery(queryUpdateTransactionStatus);

            if (typeof executeStatementUpdate.errno != 'undefined' ) {
                reject({
                    success: false,
                    message: 'ocurrio un error',
                    error: executeStatementUpdate.code
                });
            }

            if (executeStatementUpdate[0][0].success == 0) {
                resolve({
                    success: false,
                    message: '',
                    data: executeStatementUpdate[0]
                });
            }

            if (status == 'completed') {
                const queryGetTransactionInfo = `CALL escolar.sp_pasarela_get_informacion_transaction('${id}')`;
                const executeStatementGetTransactionInfo = await asyncQuery(queryGetTransactionInfo);
                
                if (typeof executeStatementGetTransactionInfo.errno != 'undefined' ) {
                    reject({
                        success: false,
                        message: 'ocurrio un error',
                        error: executeStatementUpdate.code
                    });
                    return;
                }

                const transactionData = executeStatementGetTransactionInfo[0][0];
                const  {
                    idmoodle_alumno,
                    id_plan_estudio,
                    id_servicio,
                    monto,
                    id_moodle_materia
                } = transactionData;

                console.log('executeStatementGetTransactionInfo', transactionData);

                const queryInsertPayment = 
                    `CALL escolar.sp_pasarela_registrar_pagos(
                        ${idmoodle_alumno}, 
                        ${id_plan_estudio}, 
                        ${monto}, 
                        ${id_servicio}
                    )`;
                const executeStatementInsertPayment = await asyncQuery(queryInsertPayment);
                console.log("🚀 ~ file: pagosServiciosModel.js:340 ~ returnnewPromise ~ executeStatementInsertPayment:", executeStatementInsertPayment)

                if (typeof executeStatementInsertPayment.errno != 'undefined' ) {
                    reject({
                        success: false,
                        message: 'ocurrio un error',
                        error: executeStatementUpdate.code
                    });
                    return;
                }

                if (executeStatementInsertPayment[0][0].success == 0) {
                    resolve({
                        success: false,
                        message: executeStatementInsertPayment[0][0].message
                    });
                    return;
                }

                //Pago de extraordinario
                if (id_moodle_materia != null) {
                    console.log('entro aqui en idmoodle materia');
                    const sqlQueryExamPayment = `CALL escolar.sp_pasarela_activar_extraordinario(
                                ${id_plan_estudio},
                                ${idmoodle_alumno},
                                ${id_moodle_materia}
                            );`;

                    const responseQueryExamPayment = await asyncQuery(sqlQueryExamPayment);
                    console.log("🚀 ~ file: pagosServiciosModel.js:147 ~ returnnewPromise ~ responseQueryExamPayment:", responseQueryExamPayment)

                    if (typeof responseQueryExamPayment.errno != 'undefined') {
                        reject({
                            success: false,
                            message: 'Error al insertar pago en la base de datos.',
                            error: responseQueryExamPayment.code
                        });
                        return;
                    }
    
                    if (!responseQueryExamPayment[0][0].success) {
                        resolve({
                            success: false,
                            message: responseQueryExamPayment[0][0].message,
                            data : null
                        });
                        return;
                    }
                }

                resolve({
                    success: true,
                    message: executeStatementInsertPayment[0][0].message
                });

            }



        } catch (error) {
            console.log('error', error);
            reject({
                success: false,
                message: 'Ocurrio un error en el servidor.',
                error: error
            });
        } 
    });
}

const getInformacionUsuario = (queryParams) => {
   
    return new Promise((resolve, reject) => {
        try {

            const id_plan_estudio = parseInt(queryParams.pe);
            const id_moodle_alumno = parseInt(queryParams.ma);

            const query = `CALL escolar.sp_pasarela_get_informacion_usuario(
                ${id_plan_estudio},
                ${id_moodle_alumno}
            )`;

            connection.invokeQuery(query, (res) => {
                if (typeof res.errno !== 'undefined') {
                    reject({
                        success: false,
                        message: 'Error al registrar pago',
                        error: res.code
                    });
                }

                resolve({
                    success: true,
                    message: '',
                    data: res[0]
                });
            });
        
        } catch (error) {
            reject({
                success: false,
                message: '',
                error: error
            })
        }
    });
}

const updateIdOpenPay = (body) => {

    const {
        id_plan_estudio, 
        id_moodle_alumno, 
        id_open_pay, 
        email
    } = body;

    return new Promise((resolve, reject) => {
        try {
            const query = `CALL escolar.sp_update_open_pay(
                ${id_plan_estudio},
                ${id_moodle_alumno},
                '${id_open_pay}',
                '${email}'
            )`;

            connection.invokeQuery(query, (res) => {
                if (typeof res.errno !== 'undefined') {
                    reject({
                        success: false,
                        message: 'Error al actualizar registro',
                        error: res.code
                    });
                }

                console.log('res', res[0]);


                if (res[0][0].success == 0) {
                    resolve({
                        success: false,
                        message: '',
                        data: [res[0][0]]
                    });
                }

                resolve({
                    success: true,
                    message: '',
                    data: res[0]
                });
            });

        } catch (error) {
            // console.log('error', error);
            reject({
                success: false,
                message: '',
                error: error
            });
        }
    });
}

const insertVerificationCode = (verification_code) => {
    return new Promise((resolve, reject) => {
        try {
            const query = `CALL escolar.sp_pagos_registrar_codigo_verificacion('${verification_code}');`;
    
            connection.invokeQuery(query, (res) => {
                console.log('res', res);
                if (typeof res.errno !== 'undefined') {
                    reject({
                        success: false,
                        message: 'Error',
                        error: res.code
                    });
                }
    
                resolve({
                    success: true,
                    message: '',
                    data: res[0]
                });
            });
            
        } catch (error) {
            reject({
                success: false,
                message: 'Error',
                error: res
            });
        }
    });
}

const getVerificationCodes = (verification_code) => {
    return new Promise((resolve, reject) => {
        try {
            const query = `SELECT * FROM escolar.tb_pagos_codigos_verificacion;`;
    
            connection.invokeQuery(query, (res) => {
                console.log('res', res);
                if (typeof res.errno !== 'undefined') {
                    reject({
                        success: false,
                        message: 'Error',
                        error: res.code
                    });
                }
    
                resolve({
                    success: true,
                    message: '',
                    data: res[0]
                });
            });
            
        } catch (error) {
            reject({
                success: false,
                message: 'Error',
                error: res
            });
        }
    });
}

module.exports = { 
    getServicios, 
    registrarPagoCard, 
    getInformacionUsuario, 
    updateIdOpenPay, 
    registrarPagoCash, 
    insertVerificationCode,
    getVerificationCodes,
    actualizarPagoCash };