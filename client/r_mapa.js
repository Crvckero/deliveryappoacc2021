var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var request = require("request");
var app = require('../app.js');

router.post('/lugares-cercanos/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return lugaresCercanos(req, res, idplataforma, imei);
});

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

function lugaresCercanos(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    if (!req.body.criterio)
        return res.status(200).send({});
    var criterio = limpiar(req.body.criterio.trim());
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        obtenerLugaresCercanos(req, criterio, function (respuesta) {
            return res.status(200).send(respuesta);
        }, res);
    });
}

function obtenerLugaresCercanos(req, criterio, callback, res) {
    var lt = req.body.lt;
    var lg = req.body.lg;

    var options = {
        method: 'GET', url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json?'
            + 'input=' + criterio
            + '&location=' + lt + ',' + lg
            + '&radius=90000&strictbounds'//90 kilometros de distancia filtro estricto
            + '&key=' + global._KEY_MAPA_GOOGLE
    };

    request(options, function (error, response, body) {
        if (error || !body) {
            return callback({ error: error });
        }
        let respuesta;
        try {
            respuesta = JSON.parse(body)['predictions'];
        } catch (e) {
            return callback({ error: e });
        }
        if (respuesta.length <= 0)
            return callback({ estado: 1, lL: [] });
        let respuestaLugares = [];
        let tam = respuesta.length - 1;
        respuesta.forEach(function (lugar, index) {
            respuestaLugares.push({ place_id: lugar.place_id, main: lugar.structured_formatting.main_text, secondary: lugar.structured_formatting.secondary_text, types: lugar.types });
            if (tam === index) {
                return callback({ estado: 1, lL: respuestaLugares });
            }
        });
    });

}

router.post('/localizar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return localizar(req, res, idplataforma, imei);
});

function localizar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var placeId = req.body.placeId;
    var main = req.body.main;
    var secondary = req.body.secondary;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        obtenerCoordenadasLugar(req, placeId, main, secondary, function (respuesta) {
            return res.status(200).send(respuesta);
        }, res);
    });
}


function obtenerCoordenadasLugar(req, placeId, main, secondary, callback, res) {
    let options = {
        method: 'GET',
        url: 'https://maps.googleapis.com/maps/api/geocode/json?place_id=' + placeId + '&key=' + global._KEY_MAPA_GOOGLE,
        qs: {}
    };
    request(options, function (error, response, body) {
        if (error || !body) {
            return callback({ error: error });
        }
        let respuesta;
        try {
            respuesta = JSON.parse(body).results;
        } catch (e) {
            return callback({ error: e });
        }
        if (respuesta.length <= 0)
            return callback({ error: 'S/N' });
        return callback({ estado: 1, p: respuesta[0].geometry.location });
    });
}

module.exports = router;