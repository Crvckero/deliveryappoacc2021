const archivo = require('../archivo');
var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var app = require('../app.js');

router.post('/ordenar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return ordenar(req, res, idplataforma, imei);
});

const STORE_ORDERNAR =
    "UPDATE " + _STORE_ + ".`direccion` SET `orden` = ? WHERE `id_direccion` = ? LIMIT 1;";

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
    "UPDATE " + _STORE_ + ".`direccion` SET `eliminada` = b'1' WHERE `id_direccion` = ? AND id_cliente = ? LIMIT 1;";

function eliminar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idDireccion = req.body.idDireccion;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_ELIMINAR, [idDireccion, idCliente], function () {
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
    "UPDATE " + _STORE_ + ".`direccion` SET `id_urbe` = ?, alias = ?, `referencia` = ?, `lt` = ?, `lg` = ? WHERE `id_direccion` = ? AND id_cliente = ? LIMIT 1;";

function editar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idDireccion = req.body.idDireccion;
    var alias = req.body.alias;
    var referencia = req.body.referencia;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var idUrbe = req.body.idUrbe;
    if (!idUrbe || idUrbe == 'null')
        idUrbe = null;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_EDITAR, [idUrbe, alias, referencia, lt, lg, idDireccion, idCliente], function (direcciones) {
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
    "INSERT INTO " + _STORE_ + ".`direccion` (`id_cliente`, `id_urbe`, alias, `referencia`, img, `lt`, `lg`) VALUES (?, ?, ?, ?, ?, ?, ?);";

function crear(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var alias = req.body.alias;
    var referencia = req.body.referencia;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var idUrbe = req.body.idUrbe;
    if (!idUrbe || idUrbe == 'null')
        idUrbe = null;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var dir = app.dir(req.headers.idaplicativo);
        var tipo = '&z=18&w=400&h=400&nocp=true&t=4&ra=-45&pip=10&ppi=250&vt=3';
        var url = `https://image.maps.ls.hereapi.com/mia/1.6/mapview?apiKey=${global._KEY_MAPA_HERE}&c=${lt},${lg}${tipo}`;
        var img = `${idCliente}-${new Date().getTime()}.jpg`;
        var filename = `./publica/direccion/${img}`
        archivo.crearImagen(url, filename, `${dir}/dir/${img}`, imei, function () {
            data.consultarRes(STORE_CREAR, [idCliente, idUrbe, alias, referencia, `${global._APN}/o/${dir}%2Fdir%2F${img}`, lt, lg], function (direcciones) {
                if (direcciones['insertId'] > 0)
                    return res.status(200).send({ estado: 1, idDireccion: direcciones['insertId'] });
                return res.status(200).send({ estado: 0, error: '' });
            }, res);
        });
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
    "SELECT id_direccion, id_cliente, DATE_FORMAT(fecha_registro,'%Y-%m-%d') AS fecha_registro, alias, referencia, img, lt, lg, id_urbe FROM " + _STORE_ + ".direccion WHERE id_cliente = ? AND eliminada = 0 ORDER BY orden;";

function listar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_LISTAR, [idCliente], function (direcciones) {
            return res.status(200).send({ estado: 1, direcciones: direcciones });
        }, res);
    });
}

module.exports = router;