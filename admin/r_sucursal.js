var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var store = require('./store');

router.post('/buscar', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return buscar(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function buscar(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var desde = req.body.desde;
    var cuantos = req.body.cuantos;

    var bCriterio = req.body.bCriterio;
    if (!bCriterio || bCriterio.trim() == '')
        bCriterio = '';
    var bIdUrbe = req.body.bIdUrbe;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let cio = cliente['cio'];
        data.consultarRes(`${STORE_BUSCAR} LIMIT ${desde}, ${cuantos};`, [cio, idCliente, idCliente, bCriterio], function (lista) {
            return res.status(200).send({ estado: 1, l: lista });
        }, res);

    });
}

var STORE_BUSCAR =
    "SELECT IF(DATE_SUB(CURDATE(), INTERVAL 1 DAY) > s.cerrado_hasta , '', DATE_FORMAT(s.cerrado_desde,'%e %b %Y')) AS desde, IF(DATE_SUB(CURDATE(), INTERVAL 1 DAY) > s.cerrado_hasta , '', DATE_FORMAT(s.cerrado_hasta,'%e %b %Y')) AS hasta, a.agencia, u.urbe, u.ciudad, s.id_sucursal, s.id_agencia, s.id_urbe, s.sucursal, s.direccion, s.observacion, s.lt, s.lg, s.contacto, s.mail, s.activo, s.costo_arranque, s.costo_km_recorrido, s.sessiones "
    + " FROM " + _STORE_ + ".sucursal s "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + " INNER JOIN " + _STORE_ + ".urbe u ON s.id_urbe = u.id_urbe "
    + ` WHERE s.activo = 1 AND (? = 1 OR s.id_sucursal IN ${store.SUCURSAL} OR s.id_sucursal IN ${store.SUCURSAL_POR_AGENCIA} )  AND (s.sucursal LIKE CONCAT('%', ?,  '%')) `;

router.post('/listar', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return listar(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function listar(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var desde = req.body.desde;
    var cuantos = req.body.cuantos;

    var bCriterio = req.body.bCriterio;
    if (!bCriterio || bCriterio.trim() == '')
        bCriterio = '';
    var bIdUrbe = req.body.bIdUrbe;
    var idAgencia = req.body.idAgencia;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let cio = cliente['cio'];
        data.consultarRes(STORE_CONTAR, [idAgencia, cio, idCliente, idCliente, bIdUrbe, bIdUrbe, bCriterio], function (registros) {
            if (registros.length <= 0)
                return res.status(200).send({ estado: 1, l: [], registros: 0 });
            data.consultarRes(`${STORE_LISTAR} LIMIT ${desde}, ${cuantos};`, [idAgencia, cio, idCliente, idCliente, bIdUrbe, bIdUrbe, bCriterio], function (lista) {
                return res.status(200).send({ estado: 1, l: lista, registros: registros[0]['registros'] });
            }, res);
        }, res);
    });
}

var STORE_LISTAR =
    "SELECT IF(DATE_SUB(CURDATE(), INTERVAL 1 DAY) > s.cerrado_hasta , '', DATE_FORMAT(s.cerrado_desde,'%e %b %Y')) AS desde, IF(DATE_SUB(CURDATE(), INTERVAL 1 DAY) > s.cerrado_hasta , '', DATE_FORMAT(s.cerrado_hasta,'%e %b %Y')) AS hasta, a.agencia, u.urbe, u.ciudad, s.id_sucursal, s.id_agencia, s.id_urbe, s.sucursal, s.direccion, s.observacion, s.lt, s.lg, s.contacto, s.mail, s.activo, s.costo_arranque, s.costo_km_recorrido, s.sessiones "
    + " FROM " + _STORE_ + ".sucursal s "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + " INNER JOIN " + _STORE_ + ".urbe u ON s.id_urbe = u.id_urbe "
    + ` WHERE s.activo = 1 AND (s.id_agencia = ?) AND (? = 1 OR s.id_sucursal IN ${store.SUCURSAL} OR s.id_sucursal IN ${store.SUCURSAL_POR_AGENCIA} ) AND (? = 0 OR s.id_urbe = ?) AND (s.sucursal LIKE CONCAT('%', ?,  '%')) `;

var STORE_CONTAR =
    "SELECT COUNT(s.id_sucursal) AS registros FROM " + _STORE_ + ".sucursal s "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + ` WHERE s.activo = 1 AND (s.id_agencia = ?) AND (? = 1 OR s.id_sucursal IN ${store.SUCURSAL} OR s.id_sucursal IN ${store.SUCURSAL_POR_AGENCIA} ) AND (? = 0 OR s.id_urbe = ?) AND (s.sucursal LIKE CONCAT('%', ?,  '%')) LIMIT 1`;

router.post('/editar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return editar(req, res, idplataforma, imei);
});

function editar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idSucursal = req.body.idSucursal;
    var contacto = req.body.contacto;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(SQL_EDITAR, [contacto, idSucursal], function (sucursales) {
            return res.status(200).send({ estado: 1, sucursales: sucursales });
        }, res);
    });
}

const SQL_EDITAR =
    "UPDATE " + _STORE_ + ".`sucursal` SET `contacto` = ? WHERE `id_sucursal` = ? LIMIT 1;";

module.exports = router;