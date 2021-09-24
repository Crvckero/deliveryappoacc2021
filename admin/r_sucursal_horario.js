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
    "SELECT sh.id_sucursal_horario, sh.id_sucursal, sh.tipo, sh.dia, sh.fecha, DATE_FORMAT(sh.desde,'%H:%i') AS desde, DATE_FORMAT(sh.hasta,'%H:%i') AS hasta, sh.activo FROM " + _STORE_ + ".sucursal_horario sh  "
    + " WHERE (sh.id_sucursal = ?) AND (? = -1 OR sh.activo = ? ) ";

var STORE_CONTAR =
    "SELECT COUNT(sh.id_sucursal_horario) AS registros FROM " + _STORE_ + ".sucursal_horario sh "
    + " WHERE (sh.id_sucursal = ?) AND (? = -1 OR sh.activo = ? ) LIMIT 1";


router.post('/crear', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return crear(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function crear(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idSucursal = req.body.idSucursal;
    var fecha = req.body.fecha;
    var hora_desde = req.body.hora_desde;
    var hora_hasta = req.body.hora_hasta;
    var activo = req.body.activo;
    var tipo = req.body.tipo;
    var dia = req.body.dia;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;

        data.consultarRes(STORE_CREAR, [idSucursal, tipo, dia, fecha, hora_desde, hora_hasta, activo, idCliente], function (respuesta) {
            return res.status(200).send({ estado: 1, error: 'Datos registrados correctamente' });
        }, res);
    });
}

var STORE_CREAR =
    "INSERT INTO " + _STORE_ + ".sucursal_horario (id_sucursal, tipo, dia, fecha, desde, hasta, activo, id_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?);"

router.post('/editar', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return editar(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function editar(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idSucursal = req.body.idSucursal;
    var fecha = req.body.fecha;
    var hora_desde = req.body.hora_desde;
    var hora_hasta = req.body.hora_hasta;
    var activo = req.body.activo;
    var tipo = req.body.tipo;
    var dia = req.body.dia;

    var idSucursalHorario = req.body.idSucursalHorario;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_EDITAR, [idSucursal, tipo, dia, fecha, hora_desde, hora_hasta, activo, idCliente, idSucursalHorario], function (respuesta) {
            data.consultarRes(STORE_VER, [idSucursalHorario], function (horarios) {
                return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente', horario: horarios[0] });
            }, res);
        }, res);
    });
}

var STORE_EDITAR =
    "UPDATE " + _STORE_ + ".sucursal_horario SET id_sucursal = ?, tipo = ?, dia = ?, fecha = ?, desde = ?, hasta = ?, activo = ?, id_actualizo = ? WHERE id_sucursal_horario = ? LIMIT 1;"

var STORE_VER =
    "SELECT sh.id_sucursal_horario, sh.id_sucursal, sh.tipo, sh.dia, sh.fecha, DATE_FORMAT(sh.desde,'%H:%i') AS desde, DATE_FORMAT(sh.hasta,'%H:%i') AS hasta, sh.activo FROM " + _STORE_ + ".sucursal_horario sh  "
    + " WHERE (sh.id_sucursal_horario = ?)  LIMIT 1;";

module.exports = router;