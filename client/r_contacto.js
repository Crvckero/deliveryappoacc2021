var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

router.post('/enviar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({error: 'Deprecate'});
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return enviar(req, res, idplataforma, imei);
});

function enviar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var contacto = req.body.contacto;
    var calificacion = req.body.calificacion;
    var ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    var ipInfo = req.ipInfo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_REGISTRAR, [ip, idCliente, calificacion, contacto, JSON.stringify(req.headers), JSON.stringify(ipInfo)], function () {
            return res.status(200).send({estado: 1, error: 'Agradecemos tu comentario.'});
        }, res);
    });
}

const STORE_REGISTRAR =
        "INSERT INTO `" + _STORE_ + "_register`.`contact` (fecha, ip, id_cliente, calificacion, contacto, header, info, hora) VALUES (CURDATE(), ?, ?, ?, ?, ?, ?, CURTIME());";

module.exports = router;