const express = require('express');
const { body, validationResult, check } = require('express-validator');
const router = express.Router();
const { 
        getServicios, 
        registrarPago,
        getInformacionUsuario,
        updateIdOpenPay,
        registrarPagoCash,
        registrarPagoCard
    } = require('../model/pagosServiciosModel');

router.get('/get_servicios',
    check('pe')
        .isInt()
        .withMessage('El plan de estudio es requerido y debe ser válido.'),
(req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }
    getServicios(req.query)
        .then((results) => {
            console.log('results_get', results);
            res.status(200).json(results);
        })
        .catch((error) => {
            console.log('catch_error', error);
            res.status(500).json(error);
        });
});

router.get('/get_informacion_usuario', 
    check('pe')
        .isInt()
        .withMessage('El plan de estudio debe ser un numero entero.'),
    check('ma')
        .isInt()
        .withMessage('El moodle alumno debe ser un numero entero.'),
(req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }

    getInformacionUsuario(req.query)
        .then((results) => {
            if (results.data[0].success == 0) {
                return res.status(404).json(results);
            }

            return res.status(200).json(results);
        })
        .catch((error) => {
            return res.status(500).json(error);
        });
});

router.post('/registrar_pago',
    (req, res, next) => {

    // const errors = validationResult(req);

    // if (!errors.isEmpty()) {
    //     return res.status(400).json(errors);
    // }

    // console.log('se armo');

    if (['cash','spei'].includes(req.body.type_payment)) {

        registrarPagoCash(req.body)
            .then((results) => {
            console.log("🚀 ~ file: pagosServiciosRouter.js:78 ~ .then ~ results:", results)
    
                if (results.success == false) {
                    return res.status(404).json(results);
                }
    
                return res.status(200).json(results);
            })
            .catch((error) => {
                return res.status(500).json(error);
            });
    }
    
    if (req.body.type_payment === 'card'){

        registrarPagoCard(req.body)
            .then((results) => {
    
                console.log('results', results);
                if (!results.success) {
                    return res.status(404).json(results);
                }
    
                return res.status(200).json(results);
            })
            .catch((error) => {
                return res.status(500).json(error);
            });
    }
});

router.patch('/actualizar_open_pay', 
    body('id_plan_estudio')
        .isInt()
        .withMessage('El campo de id plan estudio debe ser valido.'),
    body('id_moodle_alumno')
        .isInt()
        .withMessage('El campo de id moodle debe ser valido.'),
    body('id_open_pay')
        .isString()
        .withMessage('El campo id open pay debe ser valido.'),
    body('email')
        .isEmail()
        .withMessage('El campo email debe ser valido'),
(req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }

    updateIdOpenPay(req.body)
        .then((results) => {
            if (results.data[0].success == 0) {
                return res.status(404).json(results);
            }

            return res.status(200).json(results);
        })
        .catch((error) => {
            return res.status(500).json(error);
        });
});

module.exports =  router;