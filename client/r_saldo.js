var router = require('express').Router();
var data = require('./data.js');

router.post('/ver', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return ver(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function ver(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;

    var idClienteSaldo = req.body.idClienteSaldo;
    if (!idClienteSaldo)
        idClienteSaldo = idCliente;
    data.consultarRes(STORE_SALDO, [idClienteSaldo], function (saldos) {
        if (saldos.length > 0)
            return res.status(200).send({ estado: 1, s: saldos[0] });
        return res.status(200).send({ estado: 1, s: { saldo: 0.0, importe: 100.0, c: 0.0, credito: 0.0, cash: 0.0 } });
    }, res);
}

const STORE_SALDO =
    "SELECT s.saldo, s.importe, s.credito, s.cash FROM " + _STORE_ + ".saldo s WHERE id_cliente = ? LIMIT 1;";


module.exports = router;