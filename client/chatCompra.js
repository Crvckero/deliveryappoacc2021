var data = require('./data.js');
var chat = require('./chat.js');

const _PUSH_CHAT_MENSAJE_COMPRA = 1;
const _PUSH_CHAT_ESTADO_COMPRA = 2;

const TIME_TO_LIVE_CHAT = 60 * 30 * 1;

module.exports = {
    enviarChat: enviarChat,
    enviarEstadoChat: enviarEstadoChat
};

function enviarEstadoChat(req, imei, idCompra, idClienteEnvia, idClienteRecibe, estado, callback, res) {
    let SQL_ = STORE_MARCAR_ESTADO_ENTREGADO;
    if (estado == 3)
        SQL_ = STORE_MARCAR_ESTADO_LEDIO;
    var idaplicativo = req.headers.idaplicativo;
    data.consultarRes(SQL_, [estado, idCompra, idClienteEnvia, estado], function (marcaciones) {
        if (marcaciones['affectedRows'] > 0)
            chat.enviarSinNotificacion(idaplicativo, idClienteRecibe, imei, idCompra.toString(), { PUSH: _PUSH_CHAT_ESTADO_COMPRA, estado: estado, id_cliente: idClienteRecibe, id_compra: idCompra, sound: "default" });
        return callback({ estado: 1, error: 'Mensaje estado enviado correctamente.', id_compra: idCompra });
    }, res);
}

const STORE_MARCAR_ESTADO_ENTREGADO =
    "UPDATE " + _STORE_ + ".`compra_chat` SET `estado` = ?, fecha_entregado = NOW() WHERE id_compra = ? AND id_cliente_recibe = ? AND ? > estado;";

const STORE_MARCAR_ESTADO_LEDIO =
    "UPDATE " + _STORE_ + ".`compra_chat` SET `estado` = ?, fecha_leido = NOW() WHERE id_compra = ? AND id_cliente_recibe = ? AND ? > estado;";

function enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, envia, tipo, titulo, mensaje, valor, idCompraEstado, callback, res) {

    data.consultarRes(STORE_GUARGAR, [idCompra, idClienteEnvia, idClienteRecibe, envia, tipo, mensaje, valor, idCompraEstado], function (respuesta) {
        if (respuesta['insertId'] <= 0)
            return callback({ estado: -1, error: 'Mensaje no enviado. Intente de nuevo.' });
        let idChat = respuesta['insertId'];
        var SQL_ = '';
        if (envia == _CHAT_ENVIA_CLIENTE)
            SQL_ = STORE_SIN_LEER_CAJERO;
        else if (envia == _CHAT_ENVIA_CAJERO)
            SQL_ = STORE_SIN_LEER_CLIENTE;
        data.consultarRes(SQL_, [idCompra], function () {
            var ipInfo = req.ipInfo;
            var timezone;
            try {
                timezone = ipInfo['timezone'];
            } catch (err) {
                timezone = 'UTC';
            }
            var idaplicativo = req.headers.idaplicativo;
            data.consultarRes(STORE_VER, [timezone, timezone, idChat], function (chats) {
                if (chats.length <= 0)
                    return res.status(200).send({ estado: -1, error: 'Mensaje no enviado. Intente de nuevo.' });
                let time_to_live = (tipo == 4 || tipo == 6) ? 0 : TIME_TO_LIVE_CHAT;
                mensaje = (tipo == 4) ? '📷' : (tipo == 6 ? '🎤' : mensaje);
                chat.enviarNotificacion(idaplicativo, idClienteRecibe, imei, titulo, mensaje, idCompra.toString(), { PUSH: _PUSH_CHAT_MENSAJE_COMPRA, chat: chats[0], click_action: "FLUTTER_NOTIFICATION_CLICK", sound: "default" }, time_to_live);
                if (idClienteRecibe != idClienteEnvia)
                    chat.enviarNotificacion(idaplicativo, idClienteEnvia, imei, titulo, mensaje, idCompra.toString(), { PUSH: _PUSH_CHAT_MENSAJE_COMPRA, chat: chats[0], click_action: "FLUTTER_NOTIFICATION_CLICK", sound: "default" }, time_to_live);
                data.consultarRes(STORE_CHATS_ENVIADOS, [idCompra], function (chatsEnviados) {
                    if (chatsEnviados.length <= 0)
                        return callback({ estado: 1, error: 'Mensaje enviado correctamente.', id_chat: idChat, chats: 0 });
                    return callback({ estado: 1, error: 'Mensaje enviado correctamente.', id_chat: idChat, chats: chatsEnviados[0]['chats'] });
                }, res);

            }, res);
        }, res);
    }, res);
}

const STORE_CHATS_ENVIADOS =
    "SELECT chats FROM " + _STORE_ + ".compra c WHERE c.id_compra = ? LIMIT 1;";

const STORE_SIN_LEER_CLIENTE =
    "UPDATE " + _STORE_ + ".`compra` SET `sinLeerCliente` = sinLeerCliente + 1 WHERE `id_compra` = ? LIMIT 1;";

const STORE_SIN_LEER_CAJERO =
    "UPDATE " + _STORE_ + ".`compra` SET `sinLeerCajero` = sinLeerCajero + 1 WHERE `id_compra` = ? LIMIT 1;";

var STORE_GUARGAR =
    "INSERT INTO " + _STORE_ + ".`compra_chat` (id_compra, id_cliente_envia, id_cliente_recibe, envia, tipo, mensaje, valor, id_compra_estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";

const STORE_VER =
    "SELECT id_chat, id_compra, id_cliente_envia, id_cliente_recibe, envia, tipo, estado, mensaje, valor, id_compra_estado, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%e %b %Y %H:%i') AS fecha_registro, "
    + " DATE_FORMAT(CONVERT_TZ(fecha_registro,'UTC',?),'%H:%i') AS hora FROM " + _STORE_ + ".`compra_chat` WHERE id_chat = ? LIMIT 1;";

