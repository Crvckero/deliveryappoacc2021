var router = require('express').Router();
var chatDespacho = require('./chatDespacho.js');
var data = require('./data.js');
var validar = require('./validar');

router.post('/estado/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return estado(req, res, idplataforma, imei);
});

function estado(req, res, idplataforma, imei) {
    var idClienteEnvia = req.body.idClienteEnvia;
    var auth = req.body.auth;
    var idClienteRecibe = req.body.idClienteRecibe;
    var idDespacho = req.body.idDespacho;
    var estado = req.body.estado;

    chatDespacho.enviarEstadoChat(req, imei, idDespacho, idClienteEnvia, idClienteRecibe, estado, function (respuetsa) {
        return res.status(200).send(respuetsa);
    }, res);
}

router.post('/enviar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return enviar(req, res, idplataforma, imei);
});

function enviar(req, res, idplataforma, imei) {
    var idClienteEnvia = req.body.idClienteEnvia;
    var auth = req.body.auth;
    var idClienteRecibe = req.body.idClienteRecibe;
    var mensaje = req.body.mensaje;
    var idDespacho = req.body.idDespacho;
    var envia = req.body.envia;
    var tipo = req.body.tipo;
    var valor = req.body.valor;
    var idDespachoEstado = req.body.idDespachoEstado;
    if (!valor)
        valor = '';
    validar.token(idClienteEnvia, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, envia, tipo, cliente['nombres'], mensaje, valor, idDespachoEstado, function (respuetsa) {
            return res.status(200).send(respuetsa);
        }, res);
    });
}

router.post('/obtener/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return obtener(req, res, idplataforma, imei);
});

const STORE_OBTENER =
    "SELECT id_chat, id_despacho, id_cliente_envia, id_cliente_recibe, envia, tipo, estado, mensaje, valor, id_despacho_estado, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%e %b %Y %H:%i') AS fecha_registro, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%H:%i') AS hora FROM " + _STORE_ + ".`despacho_chat`  "
    + " WHERE id_despacho = ? ORDER BY id_chat DESC;";

function obtener(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idDespacho = req.body.idDespacho;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var ipInfo = req.ipInfo;
            var timezone;
            try {
                timezone = ipInfo['timezone'];
            } catch (err) {
                timezone = _TIME_ZONE;
            }
            if (!timezone)
                timezone = _TIME_ZONE;
        data.consultarRes(STORE_OBTENER, [timezone, timezone, idDespacho], function (chats) {
            return res.status(200).send({ estado: 1, chats: chats });
        }, res);
    });
}


module.exports = router;