var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

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
    var activo = req.body.activo;
    var idSucursal = req.body.idSucursal;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_CONTAR, [idSucursal, activo, activo], function (registros) {
            if (registros.length <= 0)
                return res.status(200).send({ estado: 1, l: [], registros: 0 });
            data.consultarRes(`${STORE_LISTAR} LIMIT ${desde}, ${cuantos};`, [idSucursal, activo, activo], function (lista) {
                return res.status(200).send({ estado: 1, l: lista, registros: registros[0]['registros'] });
            }, res);
        }, res);
    });
}

//No hace falta agregar store rol pues se solicita obligatoriamente el idSucursal que implica que se debe tener asignada para seleccionarlo.
var STORE_LISTAR =
    "SELECT c.id_cliente, c.celular, c.correo, c.nombres, c.sexo, c.likes, c.on_line, c.img, sc.id_sucursal, sc.activo, sc.calificaciones, ROUND(sc.calificacion) AS calificacion, sc.registros, sc.confirmados, sc.correctos, sc.canceladas FROM " + _STORE_ + ".sucursal_cajero sc  "
    + " INNER JOIN " + _STORE_ + ".cliente c ON sc.id_cajero = c.id_cliente"
    + " WHERE (sc.id_sucursal = ?) AND (? = -1 OR sc.activo = ? ) ";

var STORE_CONTAR =
    "SELECT COUNT(sc.id_sucursal) AS registros FROM " + _STORE_ + ".sucursal_cajero sc "
    + " WHERE (sc.id_sucursal = ?) AND (? = -1 OR sc.activo = ? ) LIMIT 1";

module.exports = router;