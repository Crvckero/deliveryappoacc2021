var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

router.post('/pre-registro', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return preRegistro(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function preRegistro(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var agencia = req.body.agencia;
    var direccion = req.body.direccion;
    var observacion = req.body.observacion;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var contacto = req.body.contacto;
    var mail = req.body.mail;
    var idUrbe = req.body.idUrbe;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VERIFICAR, [contacto, mail], function (agencias) {
            if (agencias.length > 0) {
                if (agencias[0]['contacto'] == contacto)
                    return res.status(200).send({ estado: -2, error: 'Ya registramos tu celular y estamos procesando tus datos pronto nos pondremos en contacto contigo. \n\nSi crees que hay un error por favor envíanos un contacto, puedes hacerlo yendo al menú>contacto' });
                else if (agencias[0]['mail'] == mail)
                    return res.status(200).send({ estado: -3, error: 'Ya registramos tu correo y estamos procesando tus datos pronto nos pondremos en contacto contigo. \n\nSi crees que hay un error por favor envíanos un contacto, puedes hacerlo yendo al menú>contacto' });
                return res.status(200).send({ estado: -4, error: 'Ya registramos tus datos y estamos procesando los mismos pronto nos pondremos en contacto contigo. \n\nSi crees que hay un error por favor envíanos un contacto, puedes hacerlo yendo al menú>contacto' });
            }
            data.consultarRes(STORE_CREAR, [agencia, idUrbe, direccion, lt, lg, contacto, mail, idCliente], function (respuesta) {
                return res.status(200).send({ estado: 1, error: 'Felicidades. Hemos registrado tus datos correctamente. \n\nNos pondremos en contacto contigo en los próximos dos días laborables. Agradecemos tu paciencia.' });
            }, res);
        }, res);
    });
}

const STORE_VERIFICAR =
    "SELECT contacto, mail FROM " + _STORE_ + "_register.agencia WHERE contacto = ? OR mail = ? LIMIT 1;";

const STORE_CREAR =
    "INSERT INTO " + _STORE_ + "_register.agencia (agencia, id_urbe, direccion, lt, lg, contacto, mail, id_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";

module.exports = router;