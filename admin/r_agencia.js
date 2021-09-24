var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
const store = require('./store');

router.post('/registro', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return registro(req, res, marca, modelo, so, vs, idplataforma, imei);
});

const STORE_VERIFICAR_CLIENTE =
    "SELECT id_cliente FROM " + _STORE_ + ".cliente WHERE id_aplicativo = 1000001 AND celular = ? LIMIT 1;";

const STORE_VERIFICAR_PRE_REGISTRO =
    "SELECT agencia, id_urbe, direccion, lt, lg, mail FROM " + _STORE_ + "_register.agencia WHERE contacto = ? LIMIT 1;";

function registro(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var idaplicativo = req.headers.idaplicativo;
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var contacto = req.body.contacto;
    var idUrbe = req.body.idUrbe;
    var lt = req.body.lt;
    var lg = req.body.lg;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VERIFICAR_CLIENTE, [contacto], function (clientes) {
            if (clientes.length <= 0)
                return res.status(200).send({ estado: -1, error: 'No existe un cliente registrado debes registrar un cliente con el celular especificado.' });
            var idCajero = clientes[0]['id_cliente'];
            data.consultarRes(STORE_VERIFICAR_PRE_REGISTRO, [contacto], function (preregistros) {
                if (preregistros.length <= 0)
                    return res.status(200).send({ estado: -2, error: 'No existe un registro previo.' });
                var agencia = preregistros[0]['agencia'];
                var direccion = preregistros[0]['direccion'];
                var mail = preregistros[0]['mail'];
                data.consultarRes(STORE_REGISTRAR_AGENCIA, [agencia, direccion, lt, lg, contacto, mail, idCliente], function (r_agencia) {
                    if (r_agencia['insertId'] <= 0)
                        return res.status(200).send({ estado: -3, error: 'No se creo la Agencia' });
                    var idAgencia = r_agencia['insertId'];
                    var sucursal = agencia;
                    data.consultarRes(STORE_REGISTRAR_SUCURSAL, [idAgencia, idUrbe, sucursal, direccion, lt, lg, contacto, mail, idCliente], function (r_sucursal) {
                        if (r_sucursal['insertId'] <= 0)
                            return res.status(200).send({ estado: -4, error: 'No se creo la Sucursal' });
                        var idSucursal = r_sucursal['insertId'];
                        data.consultarRes(STORE_REGISTRAR_SUCURSAL_CAJERO, [idCajero, idSucursal, idCliente], function () {
                            data.consultarRes(STORE_CERRAR_SESSION, [idCajero], function () {
                                data.consultarRes(STORE_REGISTRAR_CLIENTE_AGENCIA, [idCajero, idAgencia, idCliente, idCliente], function () {
                                    data.consultarRes(STORE_REGISTRAR_AGENCIA_APLICATIVO, [idAgencia, idaplicativo, idCliente], function () {
                                        data.consultarRes(STORE_CONVERTIR_CLIENTE_ASESOR, [idCajero], function () {
                                            data.consultarRes(STORE_REGISTRAR_SUCURSAL_HORARIO, [idSucursal], function () {
                                                data.consultar(STORE_PREREGISTRO_REGISTRADO, [idCliente, contacto]);
                                                return res.status(200).send({ estado: 1, error: `Datos registrados correctamente`, idAgencia: idAgencia });
                                            }, res);
                                        }, res);
                                    }, res);
                                }, res);
                            }, res);
                        }, res);
                    }, res);
                }, res);
            }, res);
        }, res);

    });
}

const STORE_PREREGISTRO_REGISTRADO =
    "UPDATE `" + _STORE_ + "_register`.`agencia` SET `estado` = '2', `id_actualizo` = ? WHERE `contacto` = ? LIMIT 1;";

const STORE_REGISTRAR_AGENCIA =
    "INSERT INTO " + _STORE_ + ".agencia (agencia, direccion, lt, lg, contacto, mail, id_registro) VALUES (?, ?, ?, ?, ?, ?, ?);";

const STORE_REGISTRAR_SUCURSAL =
    "INSERT INTO " + _STORE_ + ".sucursal"
    + "( id_agencia, id_urbe, sucursal, direccion, lt, lg, contacto, mail, id_registro) "
    + "VALUES "
    + "(?, ?, ?, ?, ?, ?, ?, ?, ?);";

//Es el cliente que recibe los pedidos en el APP
const STORE_REGISTRAR_SUCURSAL_CAJERO =
    "INSERT IGNORE INTO " + _STORE_ + ".sucursal_cajero (id_cajero, id_sucursal, id_registro) VALUES (?, ?, ?);";

const STORE_CERRAR_SESSION =
    "DELETE FROM " + _STORE_ + ".cliente_session WHERE id_cliente = ?;";

//Es el que puede administrar la agencia desde el APP
const STORE_REGISTRAR_CLIENTE_AGENCIA =
    "INSERT INTO `" + _STORE_ + "`.`cliente_agencia` "
    + " (`id_cliente`, `id_agencia`, `id_registro`, `activo`, `me_gusta`) "
    + " VALUES "
    + " (?, ?, ?, 1, 1) ON DUPLICATE KEY UPDATE activo = 1, me_gusta = 1, id_actualizo = ?;";

const STORE_REGISTRAR_AGENCIA_APLICATIVO =
    "INSERT IGNORE INTO " + _STORE_ + ".agencia_aplicativo (id_agencia, id_aplicativo, id_registro) VALUES (?, ?, ?);";

const STORE_CONVERTIR_CLIENTE_ASESOR =
    "UPDATE " + _STORE_ + ".cliente SET perfil = '1' WHERE (id_cliente =  ?) LIMIT 1;";

const STORE_REGISTRAR_SUCURSAL_HORARIO =
    "INSERT INTO " + _STORE_ + ".sucursal_horario (id_sucursal, tipo, dia, fecha, desde, hasta, activo, id_registro, id_actualizo, fecha_registro, fecha_actualizo, TZ) "
    + "SELECT ?, tipo, dia, fecha, '00:00:00', '00:00:00', activo, id_registro, id_actualizo, NOW(), NOW(), TZ FROM " + _STORE_ + ".sucursal_horario WHERE id_sucursal = 1;";

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
    if (!bCriterio)
        bCriterio = '';
    bCriterio = limpiar(bCriterio.trim());
    var palabras = bCriterio.split(' ');
    var SQL_ = '';
    for (let index = 0; index < palabras.length; index++) {
        if (index == 0)
            SQL_ = ` a.agencia LIKE '%${palabras[index]}%' `;
        else
            SQL_ = SQL_ + ` OR a.agencia LIKE '%${palabras[index]}%' `;
    }
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let cio = cliente['cio'];

        const STORE_LISTAR =
            "SELECT a.id_agencia, a.agencia, a.direccion, a.observacion, a.lt, a.lg, a.contacto, a.mail, a.activo FROM " + _STORE_ + ".agencia a "
            + `WHERE ( ? = 1 OR a.id_agencia IN ${store.AGENCIA} OR a.id_agencia IN ${store.AGENCIA_POR_SUCURSAL}) AND (? = -1 OR a.activo = ? ) AND (${SQL_}) `;

        const STORE_CONTAR =
            "SELECT COUNT(a.id_agencia) AS registros FROM " + _STORE_ + ".agencia a "
            + `WHERE ( ? = 1 OR a.id_agencia IN ${store.AGENCIA} OR a.id_agencia IN ${store.AGENCIA_POR_SUCURSAL}) AND (? = -1 OR a.activo = ? ) AND (${SQL_}) LIMIT 1`;

        data.consultarRes(STORE_CONTAR, [cio, idCliente, idCliente, activo, activo], function (registros) {
            if (registros.length <= 0)
                return res.status(200).send({ estado: 1, l: [], registros: 0 });
            data.consultarRes(`${STORE_LISTAR} LIMIT ${desde}, ${cuantos};`, [cio, idCliente, idCliente, activo, activo], function (lista) {
                return res.status(200).send({ estado: 1, l: lista, registros: registros[0]['registros'] });
            }, res);
        }, res);
    });
}

function limpiar(s) {
    var r = s.toLowerCase();
    r = r.replace(new RegExp(/\s/g), " ");
    r = r.replace(new RegExp(/[àáâãäå]/g), "a");
    r = r.replace(new RegExp(/[èéêë]/g), "e");
    r = r.replace(new RegExp(/[ìíîï]/g), "i");
    r = r.replace(new RegExp(/ñ/g), "n");
    r = r.replace(new RegExp(/[òóôõö]/g), "o");
    r = r.replace(new RegExp(/[ùúûü]/g), "u");
    return r;
}

router.post('/listar-pre-registro', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return listarPreRegistro(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function listarPreRegistro(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var tipo = req.body.tipo;
    if (tipo == 0)
        tipo = 1;
    else
        tipo = 0;
    data.consultarRes(STORE_LISTAR, [tipo], function (agencias) {
        return res.status(200).send({ estado: 1, agencias: agencias });
    }, res);
}

const STORE_LISTAR =
    "SELECT agencia, id_urbe, tipo, direccion, lt, lg, contacto, mail, estado FROM " + _STORE_ + "_register.agencia WHERE estado = ?;";

module.exports = router;