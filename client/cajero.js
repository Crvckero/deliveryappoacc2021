
var data = require('./data.js');
var chatCompra = require('./chatCompra.js');

module.exports = {
    confirmarPago: confirmarPago
};

const STORE_CONFIRMAR_PAGO_COMPRA =
    "UPDATE " + _STORE_ + ".`compra` SET `calificarCajero` = 1, `calificarCliente` = 1, `id_compra_estado` = ?, `fecha_pago` = NOW() WHERE `id_compra` = ? LIMIT 1;";

function confirmarPago(req, imei, idCompra, idClienteEnvia, idClienteRecibe, callback, res) {
    let idCompraEstado = _COMPRA_ENTREGADA;
    data.consultarRes(STORE_CONFIRMAR_PAGO_COMPRA, [idCompraEstado, idCompra], function () {
        data.consultarRes(STORE_OBTENER_ID_COMPRA, [idCompra], function (cajeros) {
            let mensaje = '💲 Pago realizado';
            let valor = '';
            chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, '💲 Pago realizado', mensaje, valor, idCompraEstado, function () {
                let mensaje = '🏠 Agradecemos tu confianza. 💵 El pago se ha confirmado correctamente!';
                let valor = '';
                chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '💲 Pago realizado', mensaje, valor, idCompraEstado, function () {
                    return callback({ estado: 1, cajero: cajeros[0] });
                }, res);
            }, res);
        }, res);
    }, res);
}

const STORE_OBTENER_ID_COMPRA =
    "SELECT com.acreditado, com.id_despacho, cl.on_line, com.id_direccion, com.sinLeerCajero, com.sinLeerCliente, com.calificarCliente, com.calificarCajero, com.calificacionCliente, com.calificacionCajero, com.comentarioCliente, com.comentarioCajero, "
    + " com.costo_entrega AS costo_envio, com.costo, com.detalle, com.referencia, com.lt, com.lg, com.id_cajero, cl.id_cliente, cl.codigoPais, cl.celular, cl.nombres, cl.apellidos, cl.img, cl.celularValidado, s.sucursal, com.id_compra_estado, IFNULL(com_es.estado, 'Consultar') AS estado, com.id_compra "
    + " FROM " + _STORE_ + ".compra com "
    + " INNER JOIN " + _STORE_ + ".compra_estado com_es ON com.id_compra_estado = com_es.id_compra_estado "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON com.id_cliente = cl.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cjs.id_cajero = com.id_cajero "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON com.id_sucursal = s.id_sucursal AND cjs.id_sucursal = s.id_sucursal "
    + " WHERE com.id_compra = ? LIMIT 1;";