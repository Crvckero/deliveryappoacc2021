const archivo = require('../archivo');
const sharp = require('sharp');
const { extname } = require('path');
var app = require('../app.js');
var router = require('express').Router();
var data = require('./data.js');
var multer = require('multer');
var validar = require('./validar');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './publica/promocion');
    },
    filename: function (req, file, callback) {
        callback(null, `${req.headers.img}`);
    }
});

router.post('/subir', function (req, res) {
    var imei = req.headers.imei;
    var id = req.headers.id;
    var idcliente = req.headers.idcliente;
    var idagencia = req.headers.idagencia;

    data.consultarRes(STORE_URBE_AGENIA, [idagencia], function (agencias) {
        if (agencias.length <= 0)
            return res.status(400).send({ error: 'Acceso denegado' });
        let idUrbe = agencias[0]['id_urbe'];
        var img = `${id}-${new Date().getTime()}.jpg`;
        req.headers.img = img;
        var upload = multer({ storage: storage }).single('promocion');
        upload(req, res, function (err) {
            if (err)
                return res.status(400).send({ error: 'Acceso denegado' });
            var dir = app.dir(req.headers.idaplicativo);
            var filenameOriginal = `./publica/promocion/${img}`
            reducirComprimir(filenameOriginal, function (filename) {
                archivo.subir(filename, `${dir}/pr/${img}`, imei, function () {
                    if (id <= 0) {
                        data.consultarRes(STORE_IMG_NUEVA, [idagencia, idUrbe, idcliente, `${global._APN}/o/${dir}%2Fpr%2F${img}`], function () {
                            return res.status(200).send({ estado: 1 });
                        }, res);
                    } else {
                        data.consultarRes(STORE_IMG_UPDATE, [`${global._APN}/o/${dir}%2Fpr%2F${img}`, id], function () {
                            return res.status(200).send({ estado: 1 });
                        }, res);
                    }
                });
            });
        });
    }, res);

});

const _SIZE = 512;

async function reducirComprimir(filename, callback) {
    const extendName = extname(filename);
    const thumbName = `${filename.replace(extendName, `_${_SIZE}`)}${extendName}`;
    await sharp(filename).resize(_SIZE, _SIZE).toFile(thumbName);
    return callback(thumbName);
}

const STORE_IMG_UPDATE =
    "UPDATE `" + _STORE_ + "`.`promocion` SET `imagen` = ? WHERE (`id_promocion` = ?);";

const STORE_IMG_NUEVA =
    "INSERT INTO " + _STORE_ + ".promocion (id_agencia, id_urbe, id_registro, imagen, activo, visible, aprobado) VALUES (?, ?, ?, ?, 2, 0, 1)";

const STORE_URBE_AGENIA =
    "SELECT id_urbe FROM " + _STORE_ + ".sucursal s WHERE id_agencia = ? LIMIT 1;";

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

    var producto = req.body.producto;
    var descripcion = req.body.descripcion;
    var precio = req.body.precio;
    var activo = req.body.activo;

    var incentivo = req.body.incentivo;
    var visible = req.body.visible;
    var idPromocion = req.body.idPromocion;
    var promocion = req.body.promocion;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_EDITAR, [promocion, incentivo, visible, activo, producto, descripcion, precio, idCliente, idPromocion], function () {
            return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente' });
        }, res);
    });
}

var STORE_EDITAR =
    "UPDATE " + _STORE_ + ".promocion SET promocion = ?, incentivo = ?, visible = ?, activo = ?, producto = ?, descripcion = ?, precio = ?, id_actualizo = ? WHERE id_promocion = ? LIMIT 1;";


router.post('/editar-sub-productos', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return editarSubProductos(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function editarSubProductos(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idPromocion = req.body.idPromocion;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var jsonProuctos;
        try {
            jsonProuctos = JSON.parse(req.body.productos);
        } catch (err) {
            console.log(err);
        }
        data.consultarRes(STORE_EDITAR_SUBPRODUCTOS, [JSON.stringify(jsonProuctos), idPromocion], function () {
            return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente' });
        }, res);
    });
}

const STORE_EDITAR_SUBPRODUCTOS =
    "UPDATE " + _STORE_ + ".`promocion` SET `productos` = ? WHERE `id_promocion` = ? LIMIT 1;"

module.exports = router;