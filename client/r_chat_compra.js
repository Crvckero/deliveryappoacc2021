var router = require('express').Router();
var chatCompra = require('./chatCompra.js');
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
    var idCompra = req.body.idCompra;
    var estado = req.body.estado;

    chatCompra.enviarEstadoChat(req, imei, idCompra, idClienteEnvia, idClienteRecibe, estado, function (respuetsa) {
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
    var idCompra = req.body.idCompra;
    var envia = req.body.envia;
    var tipo = req.body.tipo;
    var valor = req.body.valor;
    var idCompraEstado = req.body.idCompraEstado;
    if (!valor)
        valor = '';
    validar.token(idClienteEnvia, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, envia, tipo, cliente['nombres'], mensaje, valor, idCompraEstado, function (respuetsa) {
            if (tipo == _CHAT_TIPO_PRESUPUESTO) {
                var nuevoMensaje = 'Clic en el botón (COMPRAR 💵) si estas de acuerdo con el precio y cantidad.';
                var nuevoValor = '';
                chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, envia, _CHAT_TIPO_TEXTO, '💵  Presupuesto', nuevoMensaje, nuevoValor, idCompraEstado, function () {
                }, null);
                return res.status(200).send(respuetsa);
            }
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
    "SELECT id_chat, id_compra, id_cliente_envia, id_cliente_recibe, envia, tipo, estado, mensaje, valor, id_compra_estado, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%e %b %Y %H:%i') AS fecha_registro, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%H:%i') AS hora FROM " + _STORE_ + ".`compra_chat`  WHERE id_compra = ? ORDER BY id_chat DESC;";

function obtener(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idCompra = req.body.idCompra;
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
        data.consultarRes(STORE_OBTENER, [timezone, timezone, idCompra], function (chats) {
            return res.status(200).send({ estado: 1, chats: chats });
        }, res);
    });
}

module.exports = router;