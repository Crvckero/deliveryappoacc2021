var data = require('./data.js');
var chatDespacho = require('./chatDespacho.js'); 

module.exports = {
    cancelar: cancelar,
    iniciar: iniciar, 
    finalizar: finalizar
};

function finalizar(req, res, imei, idCliente, tipo, idDespacho, idClienteRecibe, idClienteEnvia, mensaje, callback) {
    var SQL_ = '', calificacion = 0, comentario = '';
    if (tipo == _TIPO_CLIENTE) {
        SQL_ = STORE_ENTREGAR_CLIENTE_DESPACHO;
        if (req) {
            calificacion = req.body.calificacionCliente;
            comentario = req.body.comentarioCliente;
        }
    } else if (tipo == _TIPO_CONDUCTOR) {
        SQL_ = STORE_ENTREGAR_CONDUCTOR_DESPACHO;
        if (req) {
            calificacion = req.body.calificacionConductor;
            comentario = req.body.comentarioConductor;
        }
    }
    let idDespachoEstado = _DESPACHO_ENTREGADO;
    data.consultarRes(SQL_, [idCliente, idDespachoEstado, calificacion, comentario, idDespacho], function () {
        let valor = '';
        chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, mensaje, mensaje, valor, idDespachoEstado, function () {
            if (typeof callback === "function")
                return callback({ idDespacho: idDespacho });
        }, res);
    }, res);
}

const STORE_ENTREGAR_CLIENTE_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET id_finalizo = ?, `id_despacho_estado` = ?, `calificarConductor` = 1, `calificarCliente` = 2, `calificacionCliente` = ?, `comentarioCliente` = ?, `fecha_califico_cliente` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

const STORE_ENTREGAR_CONDUCTOR_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET id_finalizo = ?, `id_despacho_estado` = ?, `calificarCliente` = 1, `calificarConductor` = 2, `calificacionConductor` = ?, `comentarioConductor` = ?, `fecha_califico_conductor` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

function cancelar(req, imei, idDespacho, idClienteEnvia, idClienteRecibe, callback, res) {
    if (idDespacho <= 0)
        return callback({ estado: 0 });
    let idDespachoEstado = _DESPACHO_CANCELADA;
    var idCliente = req.body.idCliente;
    data.consultarRes(STORE_CANCELAR_DESPACHO, [idCliente, idDespachoEstado, idDespacho], function () {
        data.consultarRes(STORE_OBTENER_ID_DESPACHO_DESPACHADOR_CLIENTE, [idDespacho], function (despachos) {
            let mensaje = '🚫 Compra cancelada';
            let valor = '';
            chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, '🚫 Compra cancelada', mensaje, valor, idDespachoEstado, function () {
                return callback({ estado: 1, despacho: despachos[0] });
            }, res);
        }, res);
    }, res);
}

const STORE_CANCELAR_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET id_cancelo = ?, `calificarConductor` = 1, `calificarCliente` = 1, `id_despacho_estado` = ?, `fecha_pago` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

const STORE_OBTENER_ID_DESPACHO_DESPACHADOR_CLIENTE =
    "SELECT c.cash, des.id_cliente AS id_cliente_solicita, c.id_cajero, 0.0 AS lt, 0.0 AS lg, cl.on_line, cl.celularValidado, des.ltA, des.lgA, des.ltB, des.lgB, des.despacho, des.ruta, des.id_compra, des.sinLeerConductor, des.sinLeerCliente, des.calificarCliente, des.calificarConductor, des.calificacionCliente, des.calificacionConductor, des.comentarioCliente, des.comentarioConductor, "
    + " des.costo_entrega AS costo_envio, des.costo, des.id_conductor, cl.id_cliente, cl.codigoPais, cl.celular, IFNULL(cl.nombres, 'Sin conductor') AS nombres, cl.img, des.id_despacho_estado, IFNULL(com_es.estado, 'Consultar') AS estado, des.id_despacho "
    + " FROM " + _STORE_ + ".despacho des "
    + " INNER JOIN " + _STORE_ + ".despacho_estado com_es ON des.id_despacho_estado = com_es.id_despacho_estado "
    + " INNER JOIN " + _STORE_ + ".compra c ON des.id_compra = c.id_compra "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON des.id_cliente = cl.id_cliente "
    + " WHERE des.id_despacho = ? LIMIT 1;";

function iniciar(req, imei, idaplicativo, idCompra, idCliente, idDespachoEstado, costo, costo_envio, ltA, lgA, ltB, lgB, despacho, ruta, timezone, meta, callback, res) {
    var km = getKilometros(ltA, lgA, ltB, lgB);
    var tipo = req.body.tipo;
    if (!tipo)
        tipo = -1;
    data.consultarRes(STORE_REGISTRAR_DESPACHO, [tipo, idaplicativo, idCompra, idCliente, idDespachoEstado, costo, costo_envio, ltA, lgA, ltB, lgB, JSON.stringify(despacho), JSON.stringify(ruta), timezone, JSON.stringify(meta)], function (respuesta) {
        let idDespacho = respuesta['insertId'];
        if (idDespacho <= 0)
            return callback({ idDespacho: 0 });
        chatDespacho.enviarDepacho(req, idDespacho, '👨🏼‍🚀 Nueva solicitud', `${km} km, ${costo_envio} USD`, idaplicativo);
        return callback({ idDespacho: idDespacho });
    }, res);
}

const STORE_REGISTRAR_DESPACHO =
    "INSERT INTO " + _STORE_ + ".despacho (tipo, id_aplicativo, id_compra, id_cliente, id_despacho_estado, costo, costo_entrega, ltA, lgA, ltB, lgB, despacho, ruta, anio, mes, fecha, meta) "
    + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, YEAR(NOW()), MONTH(NOW()), IFNULL(CONVERT_TZ(NOW(),'UTC',?), NOW()) , ?);";

getKilometros = function (lat1, lon1, lat2, lon2) {
    rad = function (x) { return x * Math.PI / 180; }
    var R = 6378.137; //Radio de la tierra en km
    var dLat = rad(lat2 - lat1);
    var dLong = rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d.toFixed(2); //Retorna tres decimales
}

