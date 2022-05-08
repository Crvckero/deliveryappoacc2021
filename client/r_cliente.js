var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var f_registrar = require('./f_registro');
var feedback = require('./feedback.js');
var app = require('../app.js');

const URL_INSIGNIA = 'https://firebasestorage.googleapis.com/v0/b/curiosity-0001.appspot.com/o/ins%2F';

router.post('/autenticar-clave', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return autenticarClave(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function autenticarClave(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var idaplicativo = req.headers.idaplicativo;
    var cliente = req.body.cliente;
    var clave = req.body.clave;
    var token = req.body.token;
    data.consultarRes(STORE_AUTENTICAR_CLAVE, [idaplicativo, cliente, clave, clave], function (clientes) {
        if (clientes.length <= 0)
            return res.status(200).send({ estado: -1, error: 'Usuario y/o contraseñas incorrectas' });
        if (clientes[0]['activo'] == 0)
            return res.status(200).send({ estado: 0, error: _MENSJAE_BLOQUEADO });

        var auth = randonToken();
        data.consultarRes(STORE_LIMPIAR_TOKEN, [token], function () {
            var meta = JSON.stringify({ 'headers': req.headers, 'ipInfo': req.ipInfo });
            data.consultarRes(STORE_REGISTRAR_SESSION, [idaplicativo, meta, clientes[0]['id_cliente'], idplataforma, imei, auth, token, marca, modelo, so, vs, auth, token, marca, modelo, so, vs, meta], function (session) {
                if (session['affectedRows'] > 0)
                    return res.status(200).send({ estado: 1, auth: auth, idCliente: clientes[0]['id_cliente'], cliente: clientes[0] });
                return res.status(200).send({ estado: -1, error: 'Usuario y/o contraseñas incorrectas' });
            }, res);
        }, res);
    }, res);
}
var STORE_LIMPIAR_TOKEN =
    "UPDATE " + _STORE_ + ".`cliente_session` SET `token` = NULL WHERE `token` = ? LIMIT 1;";

var STORE_AUTENTICAR_CLAVE =
    "SELECT u.id_urbe, u.activo, link, sexo, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento FROM " + _STORE_ + ".cliente u "
    + " WHERE u.id_aplicativo = ? AND u.celular = ? AND (u.clave = MD5(CONCAT('" + _SEMILLA + "', ?)) OR (u.cambiarClave = 1 AND u.claveTemporal = MD5(CONCAT('" + _SEMILLA + "', ?)) AND DATE_ADD(u.fecha_recupero, INTERVAL 24 HOUR) > NOW())) LIMIT 1;";

router.post('/autenticar-apple', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    var idaplicativo = req.headers.idaplicativo;
    return autenticarApple(req, res, marca, modelo, so, vs, idaplicativo, idplataforma, imei);
});

function autenticarApple(req, res, marca, modelo, so, vs, idaplicativo, idplataforma, imei) {
    var correo = req.body.correo;
    var img = 'S/N';
    var idApple = req.body.idApple;
    var nombres = req.body.nombres;
    var apellidos = req.body.apellidos;
    var token = req.body.token;
    let celular = null, cedula = null, celularValidado = 0, correoValidado = 1;
    var codigoPais = req.body.codigoPais;
    var simCountryCode = req.body.simCountryCode;
    var smn = req.body.smn;
    if (!smn)
        smn = null;
    if (!correo || correo == 'null')
        correo = null;
    if (!codigoPais)
        codigoPais = '+593';
    if (!simCountryCode)
        simCountryCode = 'EC';

    data.consultarRes(STORE_AUTENTICAR_APPLE, [idaplicativo, correo, idApple], function (clientes) {
        let clave = obtenerClave();
        if (clientes.length <= 0) {
            if (correo == null)
                return res.status(200).send({ estado: -1, error: 'Necesitamos información del correo electrónico.' });
            return f_registrar.regitrar(idaplicativo, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, idplataforma, codigoPais, simCountryCode, smn, imei, token, marca, modelo, so, vs, img, req, res);
        }
        if (clientes[0]['activo'] == 0)
            return res.status(200).send({ estado: 0, error: _MENSJAE_BLOQUEADO });
        var auth = randonToken();
        let cliente = clientes[0];
        if (correo == null)
            correo = 'null';
        data.consultarRes(STORE_REGISTRAR_ID_APPLE, [idApple, correo, correo, cliente['id_cliente']], function () {
            data.consultarRes(STORE_LIMPIAR_TOKEN, [token], function () {
                var meta = JSON.stringify({ 'headers': req.headers, 'ipInfo': req.ipInfo });
                data.consultarRes(STORE_REGISTRAR_SESSION, [idaplicativo, meta, cliente['id_cliente'], idplataforma, imei, auth, token, marca, modelo, so, vs, auth, token, marca, modelo, so, vs, meta], function (session) {
                    if (session['affectedRows'] > 0)
                        return res.status(200).send({ estado: 1, auth: auth, idCliente: cliente['id_cliente'], cliente: cliente });
                    return res.status(200).send({ estado: -1, error: 'No existe el usuario se debe registrar uno...' });
                }, res);
            }, res);
        }, res);
    }, res);
}

var STORE_AUTENTICAR_APPLE =
    "SELECT  u.id_urbe, u.activo, link, sexo, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento "
    + " FROM " + _STORE_ + ".cliente u "
    + " WHERE u.id_aplicativo = ? AND ((u.correo = ?) OR (u.idApple IS NOT NULL AND u.idApple = ?)) LIMIT 1;";

var STORE_REGISTRAR_ID_APPLE =
    "UPDATE IGNORE " + _STORE_ + ".`cliente` SET `idApple` = ?, `correo` = IF(?='null',correo,?),  `correoValidado` = '1' WHERE `id_cliente` = ? LIMIT 1;";


router.post('/autenticar-google', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    var idaplicativo = req.headers.idaplicativo;
    return autenticarGoogle(req, res, marca, modelo, so, vs, idaplicativo, idplataforma, imei);
});

function autenticarGoogle(req, res, marca, modelo, so, vs, idaplicativo, idplataforma, imei) {
    var correo = req.body.correo;
    var img = req.body.img;
    var idGoogle = req.body.idGoogle;
    var nombres = req.body.nombres;
    var apellidos = req.body.apellidos;
    var token = req.body.token;
    let celular = null, cedula = null, celularValidado = 0, correoValidado = 1;
    var codigoPais = req.body.codigoPais;
    var simCountryCode = req.body.simCountryCode;
    var smn = req.body.smn;
    if (!smn)
        smn = null;
    if (!codigoPais)
        codigoPais = '+593';
    if (!simCountryCode)
        simCountryCode = 'EC';

    data.consultarRes(STORE_AUTENTICAR_GOOGLE, [idaplicativo, correo, idGoogle], function (clientes) {
        let clave = obtenerClave();
        if (clientes.length <= 0)
            return f_registrar.regitrar(idaplicativo, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, idplataforma, codigoPais, simCountryCode, smn, imei, token, marca, modelo, so, vs, img, req, res);
        if (clientes[0]['activo'] == 0)
            return res.status(200).send({ estado: 0, error: _MENSJAE_BLOQUEADO });
        var auth = randonToken();
        let cliente = clientes[0];
        data.consultarRes(STORE_REGISTRAR_ID_GOOGLE, [idGoogle, correo, img, cliente['id_cliente']], function () {
            data.consultarRes(STORE_LIMPIAR_TOKEN, [token], function () {
                var meta = JSON.stringify({ 'headers': req.headers, 'ipInfo': req.ipInfo });
                data.consultarRes(STORE_REGISTRAR_SESSION, [idaplicativo, meta, cliente['id_cliente'], idplataforma, imei, auth, token, marca, modelo, so, vs, auth, token, marca, modelo, so, vs, meta], function (session) {
                    if (session['affectedRows'] > 0)
                        return res.status(200).send({ estado: 1, auth: auth, idCliente: cliente['id_cliente'], cliente: cliente });
                    return res.status(200).send({ estado: -1, error: 'No existe el usuario se debe registrar uno...' });
                }, res);
            }, res);
        }, res);
    }, res);
}

var STORE_AUTENTICAR_GOOGLE =
    "SELECT  u.id_urbe, u.activo, link, sexo, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento "
    + " FROM " + _STORE_ + ".cliente u "
    + " WHERE u.id_aplicativo = ? AND ((u.correo = ?) OR (u.idGoogle IS NOT NULL AND u.idGoogle = ?)) LIMIT 1;";

var STORE_REGISTRAR_ID_GOOGLE =
    "UPDATE IGNORE " + _STORE_ + ".`cliente` SET `idGoogle` = ?, `correo` = ?, `img` = ?, `correoValidado` = '1' WHERE `id_cliente` = ? LIMIT 1;";

router.post('/autenticar-facebook', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    var idaplicativo = req.headers.idaplicativo;
    return autenticarFacebook(req, res, marca, modelo, so, vs, idaplicativo, idplataforma, imei);
});

function autenticarFacebook(req, res, marca, modelo, so, vs, idaplicativo, idplataforma, imei) {
    var correo = req.body.correo;
    //var img = req.body.img;
    var idFacebook = req.body.idFacebook;
    var img = 'https://graph.facebook.com/' + idFacebook + '/picture?type=large';
    var nombres = req.body.nombres;
    var apellidos = req.body.apellidos;
    var token = req.body.token;
    let celular = null, cedula = null, celularValidado = 0, correoValidado = 1;

    var codigoPais = req.body.codigoPais;
    var simCountryCode = req.body.simCountryCode;
    var smn = req.body.smn;
    if (!smn)
        smn = null;
    if (!codigoPais)
        codigoPais = '+593';
    if (!simCountryCode)
        simCountryCode = 'EC';

    data.consultarRes(STORE_AUTENTICAR_FACEBOOK, [idaplicativo, correo, idFacebook], function (clientes) {
        let clave = obtenerClave();
        if (clientes.length <= 0) {
            if (!correo || correo === 'null' || correo == null) {
                correo = `${Date.now()}@opportunity.planck`;
                console.log(correo);
            }
            return f_registrar.regitrar(idaplicativo, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, idplataforma, codigoPais, simCountryCode, smn, imei, token, marca, modelo, so, vs, img, req, res);
        }
        if (clientes[0]['activo'] == 0)
            return res.status(200).send({ estado: 0, error: _MENSJAE_BLOQUEADO });
        var auth = randonToken();
        let cliente = clientes[0];
        data.consultarRes(STORE_REGISTRAR_ID_FACEBOOK, [idFacebook, correo, img, cliente['id_cliente']], function () {
            data.consultarRes(STORE_LIMPIAR_TOKEN, [token], function () {
                var meta = JSON.stringify({ 'headers': req.headers, 'ipInfo': req.ipInfo });
                data.consultarRes(STORE_REGISTRAR_SESSION, [idaplicativo, meta, cliente['id_cliente'], idplataforma, imei, auth, token, marca, modelo, so, vs, auth, token, marca, modelo, so, vs, meta], function (session) {
                    if (session['affectedRows'] <= 0)
                        return res.status(200).send({ estado: -1, error: 'No existe el usuario se debe registrar uno...' });
                    return res.status(200).send({ estado: 1, auth: auth, cliente: cliente });
                }, res);
            }, res);
        }, res);
    }, res);
}

var STORE_AUTENTICAR_FACEBOOK =
    "SELECT  u.id_urbe, u.activo, link, sexo, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento "
    + " FROM " + _STORE_ + ".cliente u "
    + " WHERE u.id_aplicativo = ? AND ((u.correo = ?) OR (u.idFacebook IS NOT NULL AND u.idFacebook = ?)) LIMIT 1;";

var STORE_REGISTRAR_ID_FACEBOOK =
    "UPDATE IGNORE " + _STORE_ + ".`cliente` SET `idFacebook` = ?, `correo` = ?, `img` = ?, `correoValidado` = '1' WHERE `id_cliente` = ? LIMIT 1;";

var STORE_REGISTRAR_SESSION =
    "INSERT INTO " + _STORE_ + ".cliente_session (id_aplicativo, meta, id_cliente, id_plataforma, imei, auth, token, marca, modelo, so, vs, fecha_inicio) "
    + " VALUES (?, ?, ?, ?, ?, MD5(CONCAT('" + _SEMILLA + "', ?)), ?, ?, ?, ?, ?, NOW()) "
    + " ON DUPLICATE KEY UPDATE auth = MD5(CONCAT('" + _SEMILLA + "', ?)), token= ?, marca= ?, modelo= ?, so= ?, vs= ?, activado=b'1', meta=?, on_line = 1;";

function randonToken() {
    var token = '';
    var leter = ['@', '&', '/', 'A', 'B', 'C', 'D', 'E', 'O', '@', '--', '/', 'P', 'F', 'G', 'H', '@', '&', '-*', 'I', 'J', 'K', 'L', 'M', 'N', 'O', '@', '--', '/', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'O'];
    for (var i = 0; i < 80; i++)
        token += leter[Math.floor(Math.random() * leter.length)];
    return (token);
}

function obtenerClave() {
    var numbers1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var clave = '';
    for (var i = 0; i < 5; i++)
        clave += numbers1[Math.floor(Math.random() * numbers1.length)];
    return (clave);
}

router.post('/cerrar-session/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });

    return cerrarSession(req, res);
});

var STORE_CERRAR_SESSION =
    "DELETE FROM " + _STORE_ + ".cliente_session WHERE id_cliente = ? AND id_plataforma = ? AND imei = ?;";

var STORE_CERRAR_ALL_SESSION =
    "DELETE FROM " + _STORE_ + ".cliente_session WHERE id_cliente = ? AND imei != ?;";


function cerrarSession(req, res) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    if (!idCliente)
        return res.status(400).send({ error: 'idCliente' });
    if (!auth)
        return res.status(400).send({ error: 'auth' });

    if (app.isExplorer(idCliente))
        return res.status(200).send({ estado: 1, error: 'Session cerrada correctamente.' });

    validar.token(idCliente, auth, req.headers.idplataforma, req.headers.imei, res, function (autorizado) {
        if (!autorizado)
            return;
        var idPlataforma = req.body.idPlataforma;
        var imei = req.headers.imei;
        var all = req.body.all;
        if (!idPlataforma || idPlataforma == 'null')
            idPlataforma = req.headers.idplataforma;
        if (!imei || imei == 'null')
            imei = req.headers.imei;
        if (!all)
            all = 0;
        if (all == 0)
            data.consultarRes(STORE_CERRAR_SESSION, [idCliente, idPlataforma, imei], function () {
                return res.status(200).send({ estado: 1, error: 'Session cerrada correctamente.' });
            }, res);
        else
            data.consultarRes(STORE_CERRAR_ALL_SESSION, [idCliente, req.headers.imei], function () {
                return res.status(200).send({ estado: 1, error: 'Sessiones cerradas correctamente.' });
            }, res);
    });
}

router.post('/actualizar-token/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return actualizarToken(req, res, idplataforma, imei);
});

var STORE_ACTUALIZAR_TOKEN =
    "UPDATE " + _STORE_ + ".cliente_session SET token = ?, vs = ?, fecha_cambio_token = NOW() WHERE id_cliente = ? AND imei = ? LIMIT 1;";

function actualizarToken(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var token = req.body.token;
    var vs = req.headers.vs;
    if (!idCliente)
        return res.status(400).send({ error: 'idCliente' });
    if (!auth)
        return res.status(400).send({ error: 'auth' });
    if (!token)
        return res.status(400).send({ error: 'token' });
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_LIMPIAR_TOKEN, [token], function () {
            data.consultarRes(STORE_ACTUALIZAR_TOKEN, [token, vs, idCliente, imei], function () {
                return res.status(200).send({ estado: 1, error: 'Token actualizado correctamente.' });
            }, res);
        }, res);
    });
}

router.post('/genero/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var idaplicativo = req.headers.idaplicativo;
    return genero(req, res, idplataforma, idaplicativo, imei);
});

var STORE_GENERO =
    "UPDATE " + _STORE_ + ".`cliente` SET `sexo` = ? WHERE `id_cliente` = ? LIMIT 1;";

function genero(req, res, idplataforma, idaplicativo, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var sexo = req.body.sexo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_GENERO, [sexo, idCliente], function () {
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
    var idaplicativo = req.headers.idaplicativo;
    return editar(req, res, idplataforma, idaplicativo, imei);
});

var STORE_EDITAR =
    "UPDATE " + _STORE_ + ".`cliente` SET `celular` = ?, `correo` = ?, `nombres` = ?, `fecha_nacimiento` = ? WHERE `id_cliente` = ? LIMIT 1;";

function editar(req, res, idplataforma, idaplicativo, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;

    if (!idCliente)
        return res.status(400).send({ error: 'idCliente' });

    var celular = req.body.celular;
    var correo = req.body.correo;
    var nombres = req.body.nombres;
    var fechaNacimiento = req.body.fechaNacimiento;


    if (!fechaNacimiento)
        fechaNacimiento = null;
    if (fechaNacimiento === 'null')
        fechaNacimiento = null;

    if (!celular)
        celular = null;
    if (celular === 'null')
        celular = null;

    if (!correo)
        correo = null;
    if (correo === 'null')
        correo = null;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_REVISAR, [idaplicativo, idCliente, celular, correo], function (clientes) {
            if (clientes.length > 0) {
                if (clientes[0]['celular'] == celular)
                    return res.status(200).send({ estado: -2, error: 'Celular ya registrado' });
                if (clientes[0]['correo'] == correo)
                    return res.status(200).send({ estado: -3, error: 'Correo ya registrado' });
                return res.status(200).send({ estado: -4, error: 'Número de cédula ya registrado' });
            }
            data.consultarRes(STORE_EDITAR, [celular, correo, nombres, fechaNacimiento, idCliente], function () {
                data.consultarRes(STORE_VER, [idCliente], function (clientes) {
                    if (clientes.length <= 0)
                        return res.status(200).send({ estado: -1, error: 'Usuario incorrecto' });
                    return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente.', cliente: clientes[0] });
                }, res);
            }, res);
        }, res);
    });
}

const STORE_REVISAR =
    "SELECT celular, correo, cedula FROM " + _STORE_ + ".cliente u WHERE id_aplicativo = ? AND id_cliente != ? AND (celular = ? OR correo = ?) LIMIT 1;";

router.post('/cambiar-contrasenia/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return cambiarContrasenia(req, res, idplataforma, imei);
});

var STORE_CAMBIAR_CONTRASENIA =
    "UPDATE " + _STORE_ + ".`cliente` SET cambiarClave = 0, `clave` = MD5(CONCAT('" + _SEMILLA + "', ?)) "
    + " WHERE `id_cliente` = ? AND (clave = MD5(CONCAT('" + _SEMILLA + "', ?)) OR (cambiarClave = 1 AND claveTemporal = MD5(CONCAT('" + _SEMILLA + "', ?)))) LIMIT 1;";

function cambiarContrasenia(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;

    if (!idCliente)
        return res.status(400).send({ error: 'idCliente' });

    var contraseniaAnterior = req.body.contraseniaAnterior;
    var contraseniaNueva = req.body.contraseniaNueva;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_CAMBIAR_CONTRASENIA, [contraseniaNueva, idCliente, contraseniaAnterior, contraseniaAnterior], function (respuesta) {
            if (respuesta['affectedRows'] <= 0)
                return res.status(200).send({ estado: -1, error: 'Contraseña anterior incorrecta.' });
            return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente.' });
        }, res);
    });
}

router.post('/sessiones', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return sessiones(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function sessiones(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
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
        data.consultarRes(STORE_SESSIONES, [imei, timezone, timezone, idCliente], function (sessiones) {
            return res.status(200).send({ estado: 1, sessiones: sessiones });
        }, res);
    });
}

var STORE_SESSIONES =
    'SELECT IF(? = imei, 1, 2) AS actual, DATE_FORMAT(CONVERT_TZ(fecha_inicio,"UTC",?),"%e %b %Y %H:%i") AS fecha_inicio, DATE_FORMAT(CONVERT_TZ(fecha_actualizo,"UTC",?),"%e %b %Y %H:%i") AS fecha_actualizo, id_plataforma, imei, IFNULL(JSON_UNQUOTE(JSON_EXTRACT(meta, "$.ipInfo.city")), "Desconocido") AS ciudad, IFNULL(JSON_UNQUOTE(JSON_EXTRACT(meta, "$.ipInfo.country")), "Desconocido") AS pais, IFNULL(JSON_UNQUOTE(JSON_EXTRACT(meta, "$.headers.marca")), "Desconocido") AS marca '
    + ' FROM ' + _STORE_ + '.cliente_session WHERE id_cliente = ? AND activado = 1 ORDER BY actual, fecha_actualizo;';

router.post('/verificar-validar-celular/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var idaplicativo = req.headers.idaplicativo;
    return verificarValidarCelular(req, res, idplataforma, idaplicativo, imei);
});

function verificarValidarCelular(req, res, idplataforma, idaplicativo, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var celular = req.body.celular;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_REVISAR_CELULAR, [idaplicativo, idCliente, celular], function (clientes) {
            if (clientes.length > 0)
                return res.status(200).send({ estado: -1, error: 'El número de celular que proporciono pertenece a otro cliente.' });
            data.consultarRes(STORE_VALIDAR_CELULAR, [celular, idCliente], function () {
                data.consultarRes(STORE_REVISAR_VERIFICACION, [idCliente, celular], function (verificaciones) {
                    if (verificaciones.length <= 0)
                        return res.status(200).send({ estado: 1, error: 'Proceder a verificar' });
                    return res.status(200).send({ estado: 0, error: 'Número verificado.' });
                }, res);
            }, res);
        }, res);
    });
}

const STORE_REVISAR_VERIFICACION =
    "SELECT id_cliente FROM " + _STORE_ + ".cliente_celular cc WHERE cc.id_cliente = ? AND cc.celular = ? LIMIT 1;";

var STORE_VALIDAR_CELULAR =
    "UPDATE " + _STORE_ + ".`cliente` SET `celular` = ? WHERE `id_cliente` = ? LIMIT 1;";

const STORE_REVISAR_CELULAR =
    "SELECT celular, correo, cedula FROM " + _STORE_ + ".cliente u WHERE id_aplicativo = ? AND id_cliente != ? AND (celular = ?) LIMIT 1;";

router.post('/validar-celular/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var idaplicativo = req.headers.idaplicativo;
    return validarCelular(req, res, idplataforma, idaplicativo, imei);
});

function validarCelular(req, res, idplataforma, idaplicativo, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var celular = req.body.celular;
    var idClienteVerificar = req.body.idClienteVerificar;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_REGISTART_VERIFICACION, [idClienteVerificar, celular], function () {
            data.consultarRes(STORE_VER, [idClienteVerificar], function (clientes) {
                if (clientes.length <= 0)
                    return res.status(200).send({ estado: -1, error: 'Usuario incorrecto' });
                return res.status(200).send({ estado: 1, error: 'Número verificado.', cliente: clientes[0] });
            }, res);
        }, res);
    });
}

const STORE_REGISTART_VERIFICACION =
    "INSERT INTO " + _STORE_ + ".`cliente_celular` (`id_cliente`, `celular`) VALUES (?, ?) ON DUPLICATE KEY UPDATE fecha_registro = NOW();";

router.post('/urbe', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return urbe(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function urbe(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idUrbe = req.body.idUrbe;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_URBE, [idUrbe, idCliente], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

var STORE_URBE =
    "UPDATE " + _STORE_ + ".`cliente` SET `id_urbe` = ? WHERE `id_cliente` = ? LIMIT 1;";

router.get('/insignia/:puntos', function (req, res) {
    var puntos = req.params.puntos;
    if (puntos == 0) {
        return res.redirect(307, `${URL_INSIGNIA}0.jpg?alt=media`);
    }
    else if (puntos <= 10) {
        return res.redirect(307, `${URL_INSIGNIA}10.jpg?alt=media`);
    }
    else if (puntos <= 30) {
        return res.redirect(307, `${URL_INSIGNIA}30.jpg?alt=media`);
    }
    else if (puntos <= 100) {
        return res.redirect(307, `${URL_INSIGNIA}100.jpg?alt=media`);
    }
    else if (puntos <= 500) {
        return res.redirect(307, `${URL_INSIGNIA}500.jpg?alt=media`);
    }
    else if (puntos <= 1000) {
        return res.redirect(307, `${URL_INSIGNIA}1000.jpg?alt=media`);
    }
    else if (puntos <= 2000) {
        return res.redirect(307, `${URL_INSIGNIA}2000.jpg?alt=media`);
    }
    else if (puntos <= 5000) {
        return res.redirect(307, `${URL_INSIGNIA}5000.jpg?alt=media`);
    }
    else if (puntos <= 10000) {
        return res.redirect(307, `${URL_INSIGNIA}10000.jpg?alt=media`);
    }
    else {
        return res.redirect(307, `${URL_INSIGNIA}10000.jpg?alt=media`);
    }
});

router.post('/canjear', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return canjear(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function canjear(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idClienteRefiere = req.body.idClienteRefiere;
    var tipo = req.body.tipo;
    var idaplicativo = req.headers.idaplicativo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_OBTENER_PUNTOS, [idaplicativo, tipo], function (puntos) {
            if (puntos.length <= 0)
                return;
            let _puntos = puntos[0]['puntos'];
            let idClienteReferido = idCliente;
            data.consultarRes(STORE_REGISTRAR_PUNTOS, [idClienteRefiere, idClienteReferido, tipo, _puntos], function () {
                return res.status(200).send({ estado: 1 });
            }, res);
        }, res);
    });
}

var STORE_OBTENER_PUNTOS =
    "SELECT puntos FROM " + _STORE_ + ".punto_razon WHERE id_aplicativo = ? AND tipo = ? AND activo = 1 LIMIT 1;";

var STORE_REGISTRAR_PUNTOS =
    "INSERT IGNORE INTO `" + _STORE_ + "_data`.`puntos` (`id_cliente_refiere`, `id_cliente_referido`, `tipo`, `puntos`) VALUES (?, ?, ?, ?);";

router.post('/escuchar', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return escuchar(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function escuchar(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idRastreo = req.body.idRastreo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_ESCUCHAR, [idRastreo, idCliente, imei], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

var STORE_ESCUCHAR =
    "UPDATE " + _STORE_ + ".`cliente_session` SET `id_rastreo` = ? WHERE (`id_cliente` = ?) AND (`imei` = ?);";

router.post('/cambiar-imagen/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return cambiarImagen(req, res, idplataforma, imei);
});

var STORE_CAMBIAR_IMAGEN =
    "UPDATE " + _STORE_ + ".`cliente` SET `img` = ? WHERE `id_cliente` = ? LIMIT 1;";

function cambiarImagen(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    if (!idCliente)
        return res.status(400).send({ error: 'idCliente' });
    var img = req.body.img;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_CAMBIAR_IMAGEN, [img, idCliente], function (respuesta) {
            if (respuesta['affectedRows'] <= 0)
                return res.status(200).send({ estado: -1, error: 'Imagen no actualizada.' });
            return res.status(200).send({ estado: 1, error: 'Datos actualizados correctamente.' });
        }, res);
    });
}

router.post('/recuperar-contrasenia', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return recuperarContrasenia(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function recuperarContrasenia(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var celular = req.body.celular;
    var correo = req.body.correo;
    var tipo = req.body.tipo;
    var idaplicativo = req.headers.idaplicativo;
    var SQL_, param;
    if (tipo == 0) {
        SQL_ = STORE_CONTRASENIA_CELULAR;
        param = celular;
    }
    else {
        SQL_ = STORE_CONTRASENIA_CORREO;
        param = correo;
    }
    data.consultarRes(SQL_, [idaplicativo, param], function (clientes) {
        if (clientes.length <= 0)
            return res.status(200).send({ estado: 0, error: `El ${tipo == 0 ? 'celular' : 'correo'} proporcionado no se encuentra en nuestros registros` });

        if (clientes[0]['activo'] == 0)
            return res.status(200).send({ estado: 0, error: _MENSJAE_BLOQUEADO });

        data.consultarRes(STORE_VERIFICAR_RECUPERACION, [clientes[0]['id_cliente']], function (recuperadas) {
            if (recuperadas.length > 0)
                return res.status(200).send({ estado: 1, error: `Ya enviamos una contraseña a ${clientes[0]['correo']}, si no vez el correo revisa en tu bandeja de SPAM. Para enviar otra contraseña debes esperar ${recuperadas[0]['minutos']} minuto${(parseInt(recuperadas[0]['minutos']) <= 1 ? '' : 's')}.` });
            var claveTemporal = obtenerClave();
            data.consultar(STORE_PERDURAR_RECUPERARACION_CONTRASENIA, [claveTemporal, clientes[0]['id_cliente']]);
            feedback.notificarRecuperarContrasenia(idaplicativo, clientes[0]['id_cliente'], clientes[0]['nombres'], clientes[0]['mail'], claveTemporal);
            return res.status(200).send({ estado: 1, error: `Contraseña enviada a ${clientes[0]['correo']}, si no vez el correo revisa en tu bandeja de SPAM.` });
        }, res);
    }, res);
}

const STORE_VERIFICAR_RECUPERACION =
    "SELECT MINUTE(TIMEDIFF(DATE_ADD(c.fecha_recupero, INTERVAL 6 MINUTE), NOW())) AS minutos FROM " + _STORE_ + ".cliente c WHERE c.id_cliente = ? AND c.cambiarClave = 1 AND DATE_ADD(c.fecha_recupero, INTERVAL 5 MINUTE) > NOW();";

const STORE_PERDURAR_RECUPERARACION_CONTRASENIA =
    "UPDATE " + _STORE_ + ".cliente SET cambiarClave = '1', claveTemporal = MD5(CONCAT('" + _SEMILLA + "', MD5(?))), fecha_recupero = NOW() WHERE id_cliente = ? LIMIT 1;";

const STORE_CONTRASENIA_CELULAR =
    "SELECT u.activo, correo AS mail, nombres, id_cliente, CONCAT(substring(correo, 1, 2), '*******', substring(correo, 7, length(correo))) AS correo FROM  " + _STORE_ + ".cliente u where u.id_aplicativo = ? AND u.celular = ? LIMIT 1;";

const STORE_CONTRASENIA_CORREO =
    "SELECT u.activo, correo AS mail, nombres, id_cliente, CONCAT(substring(correo, 1, 2), '*******', substring(correo, 7, length(correo))) AS correo FROM  " + _STORE_ + ".cliente u where u.id_aplicativo = ? AND u.correo = ? LIMIT 1;";

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
    var idCliente = req.body.idCliente;
    try {
        var header = JSON.stringify({ 'headers': req.headers });
        data.consultar(STORE_REGISTRAR_VIEWS, [header, idCliente]);
    } catch (err) {
        console.log('Errore header cliente ver');
    }

    let versiones = '';
    try {
        versiones = req.headers['vs'].split('.');
    } catch (exception) {
        return res.status(403).send({});
    }
    if (versiones.length != 3) return res.status(403).send({});
    var version = versiones[2];

    return ver(req, res, marca, modelo, so, vs, idplataforma, imei, version);
});

const STORE_REGISTRAR_VIEWS =
    "UPDATE " + _STORE_ + ".`cliente` SET `views` = views + 1, header = ? WHERE (`id_cliente` = ?) LIMIT 1;";

function ver(req, res, marca, modelo, so, vs, idplataforma, imei, version) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var dir = req.body.dir;
    var idplataforma = req.headers.idplataforma;
    if (!dir)
        dir = 0;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let correctos = cliente['correctos'];
        let perfil = cliente['perfil'];
        data.consultarRes(STORE_VER, [idCliente], function (clientes) {
            if (clientes.length <= 0)
                return res.status(200).send({ estado: -1, error: 'Usuario incorrecto' });
            var ipInfo = req.ipInfo;
            var timezone;
            try {
                timezone = ipInfo['timezone'];
            } catch (err) {
                timezone = 'UTC';
            }
            var idaplicativo = req.headers.idaplicativo;
            data.consultarRes(STORE_PREFERENCIAS, [idaplicativo, version], function (preferencias) {
                if (dir <= 0)
                    return res.status(200).send({ estado: 1, cliente: clientes[0], error: 'Usuario correcto', c: { preferencias: preferencias, p: (timezone == 'America/Guayaquil' ? 1 : 0) } });

                data.consultarRes(STORE_NOTIFICACION, [idCliente, idCliente, idaplicativo, idplataforma, perfil, version, correctos], function (notificaciones) {
                    if (notificaciones.length <= 0)
                        return res.status(200).send({ estado: 1, cliente: clientes[0], error: 'Usuario correcto', c: { preferencias: preferencias, p: (timezone == 'America/Guayaquil' ? 1 : 0) } });
                    data.consultar(STORE_REGISTRAR_MENSAJE, [notificaciones[0]['id_mensaje'], idCliente]);
                    return res.status(200).send({ nt: notificaciones[0], estado: 1, cliente: clientes[0], error: 'Usuario correcto', c: { preferencias: preferencias, p: (timezone == 'America/Guayaquil' ? 1 : 0) } });
                }, res);

            }, res);
        }, res);
    });
}


const STORE_REGISTRAR_MENSAJE =
    "INSERT INTO `" + _STORE_ + "_notificacion`.`mensaje_leido` (`id_mensaje`, `id_cliente`) VALUES (?, ?);";

const STORE_NOTIFICACION =
    "SELECT nm.omitir, nm.boton, nm.id_mensaje, nm.hint, nm.img, nm.datos "
    + " FROM " + _STORE_ + "_notificacion.mensaje nm "
    + " INNER JOIN " + _STORE_ + ".cliente c ON c.id_cliente = ? AND (c.id_urbe = nm.id_urbe OR nm.id_urbe = -1)  "
    + " LEFT JOIN " + _STORE_ + "_notificacion.mensaje_leido ml ON nm.id_mensaje = ml.id_mensaje AND ml.id_cliente = ? "
    + " WHERE nm.id_aplicativo = ? AND nm.activo = 1 AND CURDATE() >= nm.desde AND CURDATE() <= nm.hasta AND (nm.id_plataforma = -1 OR nm.id_plataforma = ?) AND ( nm.perfil = -1 OR nm.perfil = ? ) AND ? >= nm.min_vs AND ? >= nm.min_correctos AND ml.id_mensaje IS NULL LIMIT 1;";

var STORE_VER =
    "SELECT u.id_urbe, link, sexo, IFNULL(beta, 'null') AS beta, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento  FROM " + _STORE_ + ".cliente u WHERE u.id_cliente = ? LIMIT 1;";

const STORE_PREFERENCIAS =
    "SELECT pa.configuracion, p.codigo FROM " + _STORE_ + ".preferencia_aplicativo pa INNER JOIN " + _STORE_ + ".preferencia p ON p.id_preferencia = pa.id_preferencia WHERE pa.id_aplicativo = ? AND pa.activo = 1 AND p.activo = 1 AND ? >= pa.min_vs;";

router.post('/mensaje', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return mensaje(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function mensaje(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var accion = req.body.accion;
    var idMensaje = req.body.idMensaje;
    var SQL_;
    if (accion == 0)
        SQL_ = STORE_ACCTION_MENSAJE_OMITIR;
    else if (accion == 1)
        SQL_ = STORE_ACCTION_MENSAJE_ACEPTAR;
    else
        return res.status(200).send({ estado: 1 });
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(SQL_, [idMensaje, idCliente], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

var STORE_ACCTION_MENSAJE_ACEPTAR =
    "UPDATE `" + _STORE_ + "_notificacion`.`mensaje_leido` SET `aceptar` = '1' WHERE (`id_mensaje` = ?) and (`id_cliente` = ?);";

var STORE_ACCTION_MENSAJE_OMITIR =
    "UPDATE `" + _STORE_ + "_notificacion`.`mensaje_leido` SET `omitir` = '1' WHERE (`id_mensaje` = ?) and (`id_cliente` = ?);";

router.post('/like', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return like(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function like(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var like = req.body.like;
    var idClienteLike = req.body.idClienteLike;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_LIKES, [like, idClienteLike], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

var STORE_LIKES =
    "UPDATE " + _STORE_ + ".`cliente` SET `likes` = likes + (?) WHERE `id_cliente` = ? LIMIT 1;";

router.post('/link', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return link(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function link(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var link = req.body.link;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_LINK, [link, idCliente], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

var STORE_LINK =
    "UPDATE " + _STORE_ + ".`cliente` SET `link` = ? WHERE `id_cliente` = ? LIMIT 1;";

router.post('/rastrear', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return rastrear(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function rastrear(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var rastrear = req.body.rastrear;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_RASTREAR, [rastrear, idCliente, idplataforma, imei], function () {
            data.consultarRes(STORE_CERRAR_ALL_SESSION, [idCliente, imei], function () {
                return res.status(200).send({ estado: 1 });
            }, res);
        }, res);
    });
}

var STORE_RASTREAR =
    "UPDATE " + _STORE_ + ".`cliente_session` SET `rastrear` = ? WHERE id_cliente = ? AND id_plataforma = ? AND imei = ?;";

module.exports = router;