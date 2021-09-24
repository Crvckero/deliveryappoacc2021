var request = require("request");
var data = require('./data.js');
var app = require('../app.js');

const Url = 'https://fcm.googleapis.com/fcm/send';

const TIME_TO_LIVE_ESTADO = 0;

module.exports = {
    enviarNotificacion: enviarNotificacion,
    enviarSinNotificacion: enviarSinNotificacion,
    enviarSoloNotificacion: enviarSoloNotificacion,

    notificarConCuerpo: notificarConCuerpo
};

const STORE_TOKENS =
    "SELECT id_aplicativo, token FROM " + _STORE_ + ".cliente_session WHERE id_cliente = ? AND activado = 1 AND imei != ? AND token IS NOT NULL;";

function enviarNotificacion(idaplicativo, idCliente, imei, titulo, body, tag, dataJson, time_to_live) {
    data.consultarCallback(STORE_TOKENS, [idCliente, imei], function (clientes) {
        if (clientes['error'] || clientes.length <= 0)
            return;
        let auth = app.auth(clientes[0]['id_aplicativo']);
        var notification = { title: titulo, tag: tag, body: (body.length > 120 ? body.substring(0, 217) + '...' : body), sound: "default" };
        var registration_ids = [];
        for (var i = 0; i < clientes.length; i++)
            registration_ids[i] = clientes[i]['token'];
        if (registration_ids.length > 0)
            notificarConCuerpo(auth, registration_ids, notification, dataJson, time_to_live);
    });
}

function enviarSinNotificacion(idaplicativo, idCliente, imei, tag, dataJson) {
    data.consultarCallback(STORE_TOKENS, [idCliente, imei], function (clientes) {
        if (clientes['error'] || clientes.length <= 0)
            return;
        let auth = app.auth(clientes[0]['id_aplicativo']);
        var registration_ids = [];
        for (var i = 0; i < clientes.length; i++)
            registration_ids[i] = clientes[i]['token'];
        if (registration_ids.length > 0)
            notificarConCuerpo(auth, registration_ids, null, dataJson, TIME_TO_LIVE_ESTADO);
    });
}

function enviarSoloNotificacion(idaplicativo, idCliente, imei, tag, notification) {
    data.consultarCallback(STORE_TOKENS, [idCliente, imei], function (clientes) {
        if (clientes['error'] || clientes.length <= 0)
            return;
        let auth = app.auth(clientes[0]['id_aplicativo']);
        var registration_ids = [];
        for (var i = 0; i < clientes.length; i++)
            registration_ids[i] = clientes[i]['token'];
        if (registration_ids.length > 0)
            notificarConCuerpo(auth, registration_ids, notification, null, TIME_TO_LIVE_ESTADO);
    });
}

function notificarConCuerpo(auth, registration_ids, notification, data, time_to_live) {
    var options = {
        method: 'POST', url: Url, headers: { Connection: 'keep-alive', 'accept-encoding': 'gzip, deflate', Host: 'fcm.googleapis.com', Accept: '*/*', 'Content-Type': 'application/json', Authorization: auth },
        body: { registration_ids: registration_ids, notification: notification, data: data, priority: "high", content_available: true, mutable_content: true, time_to_live: time_to_live, apns: { headers: { 'apns-priority': '10', }, payload: { aps: { sound: 'default', } }, }, android: { priority: 'high', notification: { sound: 'default' } } }, json: true
    };
    request(options, function (error) {
        if (error)
            console.log('Error> ', error);
    });
}