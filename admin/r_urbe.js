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
    var bCriterio = req.body.bCriterio;
    if (!bCriterio || bCriterio.trim() == '')
        bCriterio = '';
    var bIdCiudad = req.body.bIdCiudad;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_CONTAR, [bIdCiudad, bIdCiudad, bCriterio, activo, activo], function (registros) {
            if (registros.length <= 0)
                return res.status(200).send({ estado: 1, l: [], registros: 0 });
            data.consultarRes(`${STORE_LISTAR} LIMIT ${desde}, ${cuantos};`, [bIdCiudad, bIdCiudad, bCriterio, activo, activo], function (lista) {
                return res.status(200).send({ estado: 1, l: lista, registros: registros[0]['registros'] });
            }, res);
        }, res);
    });
}

var STORE_LISTAR =
    "SELECT c.ciudad, u.id_urbe, u.id_ciudad, u.urbe, u.detalle, u.img, u.lt, u.lg, u.frontera, u.activo FROM " + _STORE_ + ".urbe u "
    + " INNER JOIN " + _STORE_ + ".ciudad c ON u.id_ciudad = c.id_ciudad "
    + " WHERE (? = 0 OR u.id_ciudad = ?) AND (u.urbe LIKE CONCAT('%', ?,  '%')) AND (? = -1 OR u.activo = ? )";

var STORE_CONTAR =
    "SELECT COUNT(u.id_urbe) AS registros FROM " + _STORE_ + ".urbe u "
    + "WHERE (? = 0 OR u.id_ciudad = ?) AND (u.urbe LIKE CONCAT('%', ?,  '%')) AND (? = -1 OR u.activo = ? ) LIMIT 1";

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
    var idCiudad = req.body.idCiudad;
    var urbe = req.body.urbe;
    var detalle = req.body.detalle;
    var img = req.body.img;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var activo = req.body.activo;
    var frontera;
    let tr = '';
    try {
        frontera = JSON.parse(req.body.frontera);
        let tamanio = frontera.length;
        for (var i = 0; i < tamanio; i++) {
            if (i == tamanio - 1)
                tr += `${frontera[i][0]} ${frontera[i][1]}`;
            else
                tr += `${frontera[i][0]} ${frontera[i][1]},`;
        }
    } catch (err) {
        return res.status(400).send({ estado: -1, error: 'Frontera' });
    }

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_CREAR, [idCiudad, urbe, detalle, img, lt, lg, activo, idCliente, `POLYGON((${tr}))`], function (respuesta) {
            return res.status(200).send({ estado: 1, error: 'Datos registrados correctamente' });
        }, res);
    });
}

var STORE_CREAR =
    "INSERT INTO " + _STORE_ + ".urbe (id_ciudad, urbe, detalle, img, lt, lg, activo, id_registro, frontera) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ST_PolygonFromText(?));";

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
    var idCiudad = req.body.idCiudad;
    var urbe = req.body.urbe;
    var detalle = req.body.detalle;
    var img = req.body.img;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var activo = req.body.activo;
    var frontera;
    let tr = '';
    try {
        frontera = JSON.parse(req.body.frontera);
        let tamanio = frontera.length;
        for (var i = 0; i < tamanio; i++) {
            if (i == tamanio - 1)
                tr += `${frontera[i][0]} ${frontera[i][1]}`;
            else
                tr += `${frontera[i][0]} ${frontera[i][1]},`;
        }
    } catch (err) {
        return res.status(400).send({ estado: -1, error: 'Frontera' });
    }
    var idUrbe = req.body.idUrbe;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_EDITAR, [idCiudad, urbe, detalle, img, lt, lg, activo, idCliente, `POLYGON((${tr}))`, idUrbe], function (respuesta) {
            return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente' });
        }, res);
    });
}

var STORE_EDITAR =
    "UPDATE " + _STORE_ + ".urbe SET id_ciudad = ?, urbe = ?, detalle = ?, img = ?, lt = ?, lg = ?, activo = ?, id_actualizo = ?, frontera = ST_PolygonFromText(?) WHERE id_urbe = ? LIMIT 1;";


module.exports = router;