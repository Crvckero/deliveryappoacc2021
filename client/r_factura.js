var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

router.post('/ordenar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return ordenar(req, res, idplataforma, imei);
});

const STORE_ORDERNAR =
    "UPDATE " + _STORE_ + ".`factura` SET `orden` = ? WHERE `id_factura` = ? LIMIT 1;";

function ordenar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        res.status(200).send({ estado: 1 });
        var ids = req.body.ids.split('-');
        for (var i = 0; i < ids.length; i++)
            if (ids[i].length > 0)
                data.consultar(STORE_ORDERNAR, [i, ids[i]]);
    });
}

router.post('/eliminar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return eliminar(req, res, idplataforma, imei);
});

const STORE_ELIMINAR =
    "UPDATE " + _STORE_ + ".`factura` SET `eliminada` = b'1' WHERE `id_factura` = ? AND id_cliente = ? LIMIT 1;";

function eliminar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idFactura = req.body.idFactura;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_ELIMINAR, [idFactura, idCliente], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

router.post('/editar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return editar(req, res, idplataforma, imei);
});

const STORE_EDITAR =
    "UPDATE " + _STORE_ + ".`factura` SET dni = ?, `nombres` = ?, numero = ?, `direccion` = ?, `correo` = ? WHERE `id_factura` = ? AND id_cliente = ? LIMIT 1;";

function editar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idFactura = req.body.idFactura;
    var dni = req.body.dni;
    var nombres = req.body.nombres;
    var direccion = req.body.direccion;
    var correo = req.body.correo;
    var numero = req.body.numero;
    var auth = req.body.auth;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_EDITAR, [dni, nombres, numero, direccion, correo, idFactura, idCliente], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

router.post('/crear/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return crear(req, res, idplataforma, imei);
});

const STORE_CREAR =
    "INSERT INTO " + _STORE_ + ".`factura` (`id_cliente`, dni, nombres, numero, direccion, correo) VALUES (?, ?, ?, ?, ?, ?);";

function crear(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var dni = req.body.dni;
    var nombres = req.body.nombres;
    var direccion = req.body.direccion;
    var numero = req.body.numero;
    var correo = req.body.correo;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_CREAR, [idCliente, dni, nombres, numero, direccion, correo], function (respuesta) {
            if (respuesta['insertId'] > 0)
                return res.status(200).send({ estado: 1, idFactura: respuesta['insertId'] });
            return res.status(200).send({ estado: 0, error: '' });
        }, res);
    });
}

router.post('/listar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return listar(req, res, idplataforma, imei);
});

const STORE_LISTAR =
    "SELECT id_factura, id_cliente, dni, nombres, numero, direccion, correo FROM " + _STORE_ + ".factura WHERE id_cliente = ? AND eliminada = 0 ORDER BY orden;";

function listar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_LISTAR, [idCliente], function (facturaes) {
            return res.status(200).send({ estado: 1, facturaes: facturaes });
        }, res);
    });
}

router.post('/ver/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return ver(req, res, idplataforma, imei);
});

const STORE_VER =
    "SELECT id_factura, id_cliente, dni, nombres, numero, direccion, correo FROM " + _STORE_ + ".factura WHERE id_cliente = ? AND eliminada = 0 ORDER BY orden LIMIT 1;";

function ver(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;

    var idClienteFactura = req.body.idClienteFactura;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VER, [idClienteFactura], function (facturaes) {
            if (facturaes.length <= 0)
                return res.status(200).send({ estado: -1, error: 'No hay datos de factura' });
            return res.status(200).send({ estado: 1, factura: facturaes[0] });
        }, res);
    });
}

module.exports = router;