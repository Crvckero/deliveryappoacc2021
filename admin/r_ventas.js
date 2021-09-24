var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

router.post('/comprar', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;

    return comprar(req, res, marca, modelo, so, vs, idplataforma, imei);
});

var STORE_VER_ID_CLIENTE =
    "SELECT u.perfil, u.id_urbe, link, sexo, IFNULL(beta, 'null') AS beta, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento  FROM " + _STORE_ + ".cliente u WHERE u.id_cliente = ? LIMIT 1;";

var STORE_REGISTRAR_NUEVO =
    "INSERT INTO " + _STORE_ + "_rubro.`tarjeta_cliente` (`id_cliente`, `id_tarjeta`, `recaudado`, `saldo`, `promocion`, `id_registro`, `datos`) "
    + " SELECT ?, id_tarjeta, costo, saldo, promocion, ?, ? FROM " + _STORE_ + ".tarjeta WHERE id_tarjeta = ?;";

var STORE_REGISTRAR_PAQUETE =
    "INSERT INTO " + _STORE_ + "_rubro.`tarjeta_cliente` (`id_cliente`, `id_tarjeta`, `recaudado`, `credito`, `saldo`, `promocion`, `id_registro`, `datos`) "
    + " SELECT ?, id_tarjeta, ?, ?, saldo, promocion, ?, ? FROM " + _STORE_ + ".tarjeta WHERE id_tarjeta = ?;";

function comprar(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idClienteRecargar = req.body.idClienteRecargar;
    var idTarjeta = req.body.idTarjeta;

    var credito = req.body.credito;
    var recaudado = req.body.recaudado;
    var factura = req.body.factura;

    if (!credito)
        return res.status(200).send({ estado: -1, error: 'Actualizar APP' });
    if (!recaudado)
        return res.status(200).send({ estado: -1, error: 'Actualizar APP' });
    if (!factura)
        return res.status(200).send({ estado: -1, error: 'Actualizar APP' });

    var jsonFactura;
    try {
        jsonFactura = { f: JSON.parse(factura) };
    } catch (err) {
        console.log(err);
    }
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VER_ID_CLIENTE, [idClienteRecargar], function (clientes) {
            if (clientes.length <= 0)
                return res.status(200).send({ estado: -1, error: 'Usuario incorrecto' });
            //Cuando es una activacion de despachador
            if (idTarjeta == 1)
                return data.consultarRes(STORE_REGISTRAR_NUEVO, [idClienteRecargar, idCliente, JSON.stringify(jsonFactura), idTarjeta], function (respuesta) {
                    return res.status(200).send({ estado: 1, cliente: clientes[0], error: 'Recarga exitosa' });
                }, res);
            //Cuando es recarga de nuevo paquete
            else
                data.consultarRes(STORE_VERIFICAR_CREDITO, [idClienteRecargar, credito], function (verificado) {
                    if (verificado.length <= 0)
                        return res.status(200).send({ estado: -1, error: 'Credito insuficiente' });
                    return data.consultarRes(STORE_REGISTRAR_PAQUETE, [idClienteRecargar, recaudado, credito, idCliente, JSON.stringify(jsonFactura), idTarjeta], function (respuesta) {
                        return res.status(200).send({ estado: 1, cliente: clientes[0], error: 'Recarga exitosa' });
                    }, res);
                }, res);
        }, res);
    });
}

const STORE_VERIFICAR_CREDITO =
    "SELECT id_cliente FROM " + _STORE_ + ".saldo WHERE id_cliente = ? AND ROUND(credito, 2) >= ? LIMIT 1;";

router.post('/tarjetas', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return tarjetas(req, res, marca, modelo, so, vs, idplataforma, imei);
});

var STORE_PAQUETES =
    "SELECT t.id_tarjeta, t.costo, t.saldo, t.promocion FROM " + _STORE_ + ".tarjeta t WHERE t.activo = 1;";

function tarjetas(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idaplicativo = req.headers.idaplicativo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_PAQUETES, [], function (tarjetas) {
            return res.status(200).send({ estado: 1, tarjetas: tarjetas });
        }, res);
    });
}

router.post('/ver', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;

    return ver(req, res, marca, modelo, so, vs, idplataforma, imei);
});

var STORE_VER_CELULAR =
    "SELECT u.perfil, u.id_urbe, link, sexo, IFNULL(beta, 'null') AS beta, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento  FROM " + _STORE_ + ".cliente u WHERE u.id_aplicativo = ? AND u.celular = ? LIMIT 1;";

function ver(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var celular = req.body.celular;
    var idaplicativo = req.headers.idaplicativo;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        return data.consultarRes(STORE_VER_CELULAR, [idaplicativo, celular], function (clientes) {
            if (clientes.length <= 0)
                return res.status(200).send({ estado: -1, error: 'Usuario incorrecto' });
            return res.status(200).send({ estado: 1, cliente: clientes[0], error: 'Usuario correcto' });
        }, res);
    });
}

module.exports = router;