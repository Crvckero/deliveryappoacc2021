var data = require('./data.js');
var chat = require('./chat.js');
var app = require('../app.js');

const _PUSH_CHAT_MENSAJE_DESPACHO = 5;
const _PUSH_CHAT_ESTADO_DESPACHO = 6;
const _PUSH_OBJECT = 100;

const TIME_TO_LIVE_CHAT = 60 * 30 * 1;

module.exports = {
    enviarChat: enviarChat,
    enviarEstadoChat: enviarEstadoChat,
    enviarDepacho: enviarDepacho
};

function enviarEstadoChat(req, imei, idDespacho, idClienteEnvia, idClienteRecibe, estado, callback, res) {
    let SQL_ = STORE_MARCAR_ESTADO_ENTREGADO;
    if (estado == 3)
        SQL_ = STORE_MARCAR_ESTADO_LEDIO;
    var idaplicativo = req.headers.idaplicativo;
    data.consultarRes(SQL_, [estado, idDespacho, idClienteEnvia, estado], function (marcaciones) {
        if (marcaciones['affectedRows'] > 0)
            chat.enviarSinNotificacion(idaplicativo, idClienteRecibe, imei, idDespacho.toString(), { PUSH: _PUSH_CHAT_ESTADO_DESPACHO, estado: estado, id_cliente: idClienteRecibe, id_despacho: idDespacho, sound: "default" });
        return callback({ estado: 1, error: 'Mensaje estado enviado correctamente.', id_despacho: idDespacho });
    }, res);
}

const STORE_MARCAR_ESTADO_ENTREGADO =
    "UPDATE " + _STORE_ + ".`despacho_chat` SET `estado` = ?, fecha_entregado = NOW() WHERE id_despacho = ? AND id_cliente_recibe = ? AND ? > estado;";

const STORE_MARCAR_ESTADO_LEDIO =
    "UPDATE " + _STORE_ + ".`despacho_chat` SET `estado` = ?, fecha_leido = NOW() WHERE id_despacho = ? AND id_cliente_recibe = ? AND ? > estado;";

function enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, envia, tipo, titulo, mensaje, valor, idDespachoEstado, callback, res) {
    data.consultarRes(STORE_GUARGAR, [idDespacho, idClienteEnvia, idClienteRecibe, envia, tipo, mensaje, valor, idDespachoEstado], function (respuesta) {
        if (respuesta['insertId'] <= 0)
            return callback({ estado: -1, error: 'Mensaje no enviado. Intente de nuevo.' });
        let idChat = respuesta['insertId'];
        var SQL_, ARGS_;
        if (envia == _CHAT_ENVIA_CLIENTE) {
            SQL_ = STORE_SIN_LEER_CONDUCTOR;
            ARGS_ = [idDespacho, idClienteEnvia];
        }
        else if (envia == _CHAT_ENVIA_CAJERO) {
            SQL_ = STORE_SIN_LEER_CLIENTE;
            ARGS_ = [idDespacho, idClienteRecibe];
        }
        data.consultarRes(SQL_, ARGS_, function () {
            var ipInfo = req.ipInfo;
            var timezone;
            try {
                timezone = ipInfo['timezone'];
            } catch (err) {
                timezone = 'UTC';
            }
            var idaplicativo = req.headers.idaplicativo;
            data.consultarRes(STORE_VER, [idDespacho, timezone, timezone, idChat], function (chats) {
                if (chats.length <= 0)
                    return res.status(200).send({ estado: -1, error: 'Mensaje no enviado. Intente de nuevo.' });
                let time_to_live = (tipo == 4 || tipo == 6) ? 0 : TIME_TO_LIVE_CHAT;
                mensaje = (tipo == 4) ? '📷' : (tipo == 6 ? '🎤' : mensaje);
                chat.enviarNotificacion(idaplicativo, idClienteRecibe, imei, titulo, mensaje, idDespacho.toString(), { PUSH: _PUSH_CHAT_MENSAJE_DESPACHO, chat: chats[0], click_action: "FLUTTER_NOTIFICATION_CLICK", sound: "default" }, time_to_live);
                if (idClienteRecibe != idClienteEnvia)
                    chat.enviarNotificacion(idaplicativo, idClienteEnvia, imei, titulo, mensaje, idDespacho.toString(), { PUSH: _PUSH_CHAT_MENSAJE_DESPACHO, chat: chats[0], click_action: "FLUTTER_NOTIFICATION_CLICK", sound: "default" }, time_to_live);
                data.consultarRes(STORE_CHATS_ENVIADOS, [idDespacho], function (chatsEnviados) {
                    if (chatsEnviados.length <= 0)
                        return callback({ estado: 1, error: 'Mensaje enviado correctamente.', id_chat: idChat, chats: 0 });
                    return callback({ estado: 1, error: 'Mensaje enviado correctamente.', id_chat: idChat, chats: chatsEnviados[0]['chats'] });
                }, res);
            }, res);

        }, res);
    }, res);
}

const STORE_CHATS_ENVIADOS =
    "SELECT chats FROM " + _STORE_ + ".despacho c WHERE c.id_despacho = ? LIMIT 1;";

const STORE_SIN_LEER_CLIENTE =
    "UPDATE " + _STORE_ + ".`despacho` SET `sinLeerCliente` = sinLeerCliente + 1 WHERE `id_despacho` = ? LIMIT 1;";

const STORE_SIN_LEER_CONDUCTOR =
    "UPDATE " + _STORE_ + ".`despacho` SET `sinLeerConductor` = sinLeerConductor + 1 WHERE `id_despacho` = ? LIMIT 1;";

var STORE_GUARGAR =
    "INSERT IGNORE INTO " + _STORE_ + ".`despacho_chat` (id_despacho, id_cliente_envia, id_cliente_recibe, envia, tipo, mensaje, valor, id_despacho_estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";

const STORE_VER =
    "SELECT id_chat, ? AS id_despacho, id_cliente_envia, id_cliente_recibe, envia, tipo, estado, mensaje, valor, id_despacho_estado, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%e %b %Y %H:%i') AS fecha_registro, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%H:%i') AS hora FROM " + _STORE_ + ".`despacho_chat` WHERE id_chat = ? LIMIT 1;";

const STORE_TOKENS_DESPACHADORES_ALL =
    "SELECT cs.id_aplicativo, cs.token FROM " + _STORE_ + ".cliente_session cs "
    + " INNER JOIN " + _STORE_ + ".cliente c ON c.id_cliente = cs.id_cliente AND c.id_urbe = ? "
    + " LEFT JOIN " + _STORE_ + ".asignado a ON a.id_conductor = cs.id_cliente "
    + " LEFT JOIN " + _STORE_ + ".cliente_settings cst ON cst.id_cliente = cs.id_cliente "
    // Aumentar INTERVAL 0 MINUTE Si se desea no notificar al inicio un motorizado que ya atendio un pedido al renotificar le va a llegar si o si
    + ' WHERE (a.id_conductor IS NULL OR ? = 0 OR DATE_SUB(NOW(), INTERVAL 0 MINUTE) >= a.fecha_asignado) AND cs.rastrear = 1 AND (cst.id_cliente IS NULL OR JSON_SEARCH(cst.settings->"$.lA", "all", ?)) LIMIT 200;';

const STORE_TOKENS_DESPACHADORES_RESTRIC =
    "SELECT cs.id_aplicativo, cs.token FROM " + _STORE_ + ".cliente_settings cst "
    + " INNER JOIN " + _STORE_ + ".cliente_session cs ON cst.id_cliente = cs.id_cliente "
    + ' WHERE cs.rastrear = 1 AND JSON_SEARCH(cst.settings->"$.lA", "all", ?) LIMIT 200;';

const TIME_TO_LIVE_DESPACHO = 0;
const EVALUAR_NOTIFICADA = 1;
const NO_EVALUAR_NOTIFICADA = 0;

//Cuando se genera un nuevo despacho
function enviarDepacho(req, idDespacho, titulo, mensaje, idaplicativo) {
    data.consultarCallback(STORE_OBTENER_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
        if (despachos['error'] || despachos.length <= 0)
            return;
        var despacho = despachos[0];
        var idUrbe = despachos[0]['id_urbe'];
        var SQL_;
        var ARGS_;
        // Si la agencia esta restringida se notifica solo a las motos que tenga " + _STORE_ + ".cliente_settings a esa agencia
        // Si la solicitud sale desde otro aplicativo tabien se restrinje y se notifica solo a las motos que tenga " + _STORE_ + ".cliente_settings a esa agencia en caso de app.restringirApp(idaplicativo) devolver 1
        // Una agencia se restringe solo si sus motos cumplen el proceso para ser restringidas.
        // No restringir una agencia de un APP personalizado permite tomar a motos de Opportunity en caso de no tener quien despache.
        var restringir = app.restringirApp(idaplicativo);
        if (despacho['restriccion'] == 1 || restringir == 1) {
            SQL_ = STORE_TOKENS_DESPACHADORES_RESTRIC;
            ARGS_ = [despacho['id_agencia']];
        } else {
            SQL_ = STORE_TOKENS_DESPACHADORES_ALL;//No notifica a las motos con " + _STORE_ + ".cliente_settings pero si poseen la agencia asignada los incluye
            ARGS_ = [idUrbe, EVALUAR_NOTIFICADA, despacho['id_agencia']];
        }
        notificar(titulo, mensaje, SQL_, ARGS_, idUrbe, idDespacho, despacho, true, idaplicativo);
    });
}

function notificar(titulo, mensaje, sql, args, idUrbe, idDespacho, despacho, isRenotificar, idaplicativo) {
    data.consultarCallback(sql, args, function (clientes) {
        if (clientes['error'])
            return;
        let auth = app.auth(idaplicativo);
        var registration_ids = [];
        for (var i = 0; i < clientes.length; i++)
            registration_ids[i] = clientes[i]['token'];
        var notification = { title: titulo, tag: '-75132912-', body: mensaje };
        if (registration_ids.length > 0) {
            var data = { PUSH: _PUSH_OBJECT, click_action: "FLUTTER_NOTIFICATION_CLICK", sound: "default", tipo: 1, despacho: despacho };
            chat.notificarConCuerpo(auth, registration_ids, notification, data, TIME_TO_LIVE_DESPACHO);
        }
        renotificar(titulo, mensaje, idUrbe, idDespacho, despacho, isRenotificar, idaplicativo);
    });
}

function renotificar(titulo, mensaje, idUrbe, idDespacho, despacho, isRenotificar, idaplicativo) {
    setTimeout(function () {
        verrificar(idDespacho, function (isNotificar) {
            if (isNotificar) {
                var SQL_;
                var ARGS_;
                var restringir = app.restringirApp(idaplicativo);
                if (despacho['restriccion'] == 1 || restringir == 1) {
                    SQL_ = STORE_TOKENS_DESPACHADORES_RESTRIC;
                    ARGS_ = [despacho['id_agencia']];
                } else {
                    SQL_ = STORE_TOKENS_DESPACHADORES_ALL;//No notifica a las motos con " + _STORE_ + ".cliente_settings pero si poseen la agencia asignada los incluye
                    ARGS_ = [idUrbe, NO_EVALUAR_NOTIFICADA, despacho['id_agencia']];
                }
                notificar(titulo, mensaje, SQL_, ARGS_, idUrbe, idDespacho, despacho, false, idaplicativo);
            }
        });
    }, isRenotificar ? 10000 : 4500);
}

function verrificar(idDespacho, callback) {
    data.consultarCallback(STORE_VERIFICAR_DESPACHO_PENDIENTE, [idDespacho], function (despachos) {
        if (despachos['error'] || despachos.length <= 0)
            return callback(false);
        return callback(true);
    });
}

const STORE_VERIFICAR_DESPACHO_PENDIENTE =
    "SELECT id_despacho FROM " + _STORE_ + ".despacho WHERE id_despacho = ? AND id_despacho_estado = 1 lIMIT 1;";

const STORE_OBTENER_ID_DESPACHO_CLIENTE =
    "SELECT des.preparandose, des.tipo, s.id_urbe, s.id_agencia, a.restriccion, c.id_cajero, 0.0 AS lt, 0.0 AS lg, cl.on_line, cl.celularValidado, des.ltA, des.lgA, des.ltB, des.lgB, des.despacho, des.ruta, des.id_compra, des.sinLeerConductor, des.sinLeerCliente, des.calificarCliente, des.calificarConductor, des.calificacionCliente, des.calificacionConductor, des.comentarioCliente, des.comentarioConductor, "
    + " des.costo_entrega AS costo_envio, des.costo, des.id_conductor, cl.id_cliente, cl.codigoPais, cl.celular, IFNULL(cl.nombres, 'Sin conductor') AS nombres, cl.img, des.id_despacho_estado, IFNULL(com_es.estado, 'Consultar') AS estado, des.id_despacho "
    + " FROM " + _STORE_ + ".despacho des "
    + " INNER JOIN " + _STORE_ + ".despacho_estado com_es ON des.id_despacho_estado = com_es.id_despacho_estado "
    + " INNER JOIN " + _STORE_ + ".compra c ON des.id_compra = c.id_compra "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON des.id_cliente = cl.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = c.id_sucursal "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + " WHERE des.id_despacho = ? LIMIT 1;";