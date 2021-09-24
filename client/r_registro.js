var router = require('express').Router();
var data = require('./data.js');
var f_registrar = require('./f_registro');

router.post('/registrar/', function (req, res) {
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
    return registrar(req, res, marca, modelo, so, vs, idplataforma, imei, idaplicativo);
});

function registrar(req, res, marca, modelo, so, vs, idplataforma, imei, idaplicativo) {

    var celular = req.body.celular;
    var correo = req.body.correo;
    var nombres = req.body.nombres;
    var apellidos = req.body.apellidos;
    var cedula = req.body.cedula;
    var celularValidado = req.body.celularValidado;
    var correoValidado = req.body.correoValidado;
    var codigoPais = req.body.codigoPais;
    var token = req.body.token;
    var simCountryCode = req.body.simCountryCode;
    var smn = req.body.smn;
    if (!smn)
        smn = null;
    if (!simCountryCode)
        simCountryCode = 'EC';
    if (!codigoPais)
        return res.status(400).send({ error: 'codigoPais' });
    if (!apellidos)
        return res.status(400).send({ error: 'apellidos' });
    if (!token)
        return res.status(400).send({ error: 'token' });
    if (!celular)
        return res.status(400).send({ error: 'celular' });
    if (!correo)
        return res.status(400).send({ error: 'correo' });
    if (!nombres)
        return res.status(400).send({ error: 'nombres' });
    if (!cedula)
        cedula = null;
    if (cedula == 'null')
        cedula = null;
    if (!celularValidado)
        return res.status(400).send({ error: 'celularValidado' });
    if (!correoValidado)
        return res.status(400).send({ error: 'correoValidado' });

    var emailRegexNombres = /^[a-zñáéíóú A-ZÑÁÉÍÓÚ]+$/;

    if (!emailRegexNombres.test(nombres))
        return res.status(200).send({ estado: -5, error: 'Nombres inválidos, no se permiten caracteres especiales' });

    if (!emailRegexNombres.test(apellidos))
        return res.status(200).send({ estado: -6, error: 'Apellidos inválidos, no se permiten caracteres especiales' });

    var emailRegexCorreo = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;
    if (!emailRegexCorreo.test(correo))
        return res.status(200).send({ estado: -7, error: 'El correo enviado no posee lo requisitos mínimos' });

    data.consultarRes(STORE_REVISAR, [idaplicativo, celular, correo], function (clientes) {
        if (clientes.length > 0) {
            if (clientes[0]['celular'] == celular)
                return res.status(200).send({ estado: -2, error: 'Celular ya registrado' });
            else if (clientes[0]['correo'] == correo)
                return res.status(200).send({ estado: -3, error: 'Correo ya registrado' });
            return res.status(200).send({ estado: -4, error: 'Número de cédula ya registrado.' });
        }
        let img = '';
        let clave = obtenerClave();
        f_registrar.regitrar(idaplicativo, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, idplataforma, codigoPais, simCountryCode, smn, imei, token, marca, modelo, so, vs, img, req, res);
    }, res);
}

function obtenerClave() {
    var numbers1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var clave = '';
    for (var i = 0; i < 5; i++)
        clave += numbers1[Math.floor(Math.random() * numbers1.length)];
    return (clave);
}

const STORE_REVISAR =
    "SELECT celular, correo, cedula FROM " + _STORE_ + ".cliente u WHERE id_aplicativo = ? AND (celular = ? OR correo = ?) LIMIT 1;";

module.exports = router;
