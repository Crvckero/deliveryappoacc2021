var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var chatCompra = require('./chatCompra.js');
var despacho = require('./despacho.js');

router.post('/ver-costo-promocion/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return verCostoPromocion(req, res, idplataforma, imei);
});

var STORE_VER_COSTO =
    "SELECT ANY_VALUE(ap.isTarjeta) AS isTarjeta, ANY_VALUE(s.id_agencia) AS id_agencia, "
    + " MIN(ROUND((ST_Distance(POINT(s.lt, s.lg), POINT(?,?)) * 100), 3)) AS dt, "
    + " IF(MIN( (costo_arranque + (costo_km_recorrido * (ROUND((ST_Distance(POINT(s.lt, s.lg), POINT(?,?)) * 100), 2))))) < 0, 0, " + _STORE_ + ".f_redondear(MIN((costo_arranque + (costo_km_recorrido * (ROUND((ST_Distance(POINT(s.lt, s.lg), POINT(?,?)) * 100), 2))))))) AS costo_envio, "
    + " ANY_VALUE(s.id_sucursal) AS id_sucursal, ? AS referencia, "
    + " ANY_VALUE(cjs.id_cajero) AS id_cajero, ? AS id_cliente, ANY_VALUE(cj.nombres) AS nombres, "
    + " ANY_VALUE(cj.img) AS img, ANY_VALUE(s.sucursal) AS sucursal "
    + " FROM " + _STORE_ + ".cliente cj "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cj.id_cliente = cjs.id_cajero AND cjs.activo = 1 "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON cjs.id_sucursal = s.id_sucursal AND s.activo = 1 "
    + " INNER JOIN " + _STORE_ + ".agencia a ON a.id_agencia = s.id_agencia "
    + " INNER JOIN " + _STORE_ + ".agencia_aplicativo ap ON a.id_agencia = ap.id_agencia AND ap.id_aplicativo = ? ";

var STORE_VER_COSTO_ECONCOMIENTA =
    "SELECT 0 AS isTarjeta, 0 AS pT, ANY_VALUE(s.id_agencia) AS id_agencia, "
    + " ? AS dt, "
    + " MIN( ROUND(costo_arranque + (costo_km_recorrido * ? ), 1)) AS costo_envio, "
    + " ANY_VALUE(s.id_sucursal) AS id_sucursal, ? AS referencia, "
    + " ANY_VALUE(cjs.id_cajero) AS id_cajero, ? AS id_cliente, ANY_VALUE(cj.nombres) AS nombres, "
    + " ANY_VALUE(cj.img) AS img, ANY_VALUE(s.sucursal) AS sucursal "
    + " FROM " + _STORE_ + ".cliente cj "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cj.id_cliente = cjs.id_cajero AND cjs.activo = 1 "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON cjs.id_sucursal = s.id_sucursal AND s.activo = 1 ";

function verCostoPromocion(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var referencia = req.body.referencia;
    var idaplicativo = req.headers.idaplicativo;
    var agencias = req.body.agencias; //Formato 1,2,3
    agencias = agencias.toString().split(' ').join('');

    var SQL_ = STORE_VER_COSTO;
    var ARGS = [lt, lg, lt, lg, lt, lg, referencia, idCliente, idaplicativo];

    var tipo = req.body.tipo;
    if (tipo == _TIPO_ENCOMIENDA) {
        var ltE = req.body.ltE;
        var lgE = req.body.lgE;
        var dis = getKilometros(lt, lg, ltE, lgE);
        SQL_ = STORE_VER_COSTO_ECONCOMIENTA;
        if (!referencia || referencia == 'null' || referencia == null)
            referencia = 'Ubicación en MAPA';
        ARGS = [dis, dis, referencia, idCliente];
    }

    data.consultarRes(SQL_VER_SALDO, [idCliente], function (saldos) {
        var saldo = 0.0
        var cash = 0.0;
        if (saldos.length > 0) {
            saldo = saldos[0]['saldo'];
            cash = saldos[0]['cash'];
        }
        data.consultarRes(` ${SQL_START_} ${SQL_} WHERE s.id_agencia IN (${agencias}) AND (s.id_sucursal IN ( ${STORE_SURSALES_HORARIO} ) ) GROUP BY s.id_sucursal ORDER BY dt LIMIT 10 ${SQL_END_} `, ARGS, function (cajeros) {
            if (cajeros.length > 0)
                return res.status(200).send({ estado: 1, cajero: cajeros[0], cajeros: cajeros, saldo: saldo, cash: cash });
            return res.status(200).send({ estado: -1, error: 'Error', saldo: saldo, cash: cash });
        }, res);
    }, res);
}

var SQL_VER_SALDO =
    "SELECT saldo, cash FROM " + _STORE_ + ".saldo WHERE id_cliente = ? LIMIT 1;";

var SQL_START_ =
    `SELECT isTarjeta, c.id_agencia, MIN(c.costo_envio) AS costo_envio, c.id_sucursal, c.referencia, c.id_cajero, c.id_cliente, c.nombres, c.img, c.sucursal FROM ( `;

var SQL_END_ =
    `) AS c GROUP BY c.id_agencia`;

var STORE_SURSALES_HORARIO =
    "SELECT s.id_sucursal FROM " + _STORE_ + ".sucursal_horario sh "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON sh.id_sucursal = s.id_sucursal "
    + " WHERE sh.activo = 1 AND DATE_FORMAT(CONVERT_TZ(NOW(),'UTC', sh.TZ),'%w') = sh.dia AND "
    + " TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) >= sh.desde AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) <= sh.hasta";

router.post('/listar-registros/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return listarRegistros(req, res, idplataforma, imei);
});

var STORE_OBTENER_COMPRAS =
    "SELECT com.acreditado, com.id_despacho, cl.on_line, com.id_direccion, com.sinLeerCajero, com.sinLeerCliente, com.calificarCliente, com.calificarCajero, com.calificacionCliente, com.calificacionCajero, com.comentarioCliente, com.comentarioCajero, "
    + " com.costo_entrega AS costo_envio, com.costo, com.detalle, com.referencia, s.lt, s.lg, com.lt AS ltB, com.lg AS lgB, com.id_cajero, cl.id_cliente, cl.codigoPais, cl.celular, cl.nombres, cl.apellidos, cl.img, cl.celularValidado, s.sucursal, com.id_compra_estado, IFNULL(com_es.estado, 'Consultar') AS estado, com.id_compra "
    + " FROM " + _STORE_ + ".compra com "
    + " INNER JOIN " + _STORE_ + ".compra_estado com_es ON com.id_compra_estado = com_es.id_compra_estado "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON com.id_cliente = cl.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cjs.id_cajero = com.id_cajero "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON com.id_sucursal = s.id_sucursal AND cjs.id_sucursal = s.id_sucursal "
    + " WHERE com.id_cajero = ? ";

function listarRegistros(req, res, idplataforma, imei) {
    var idCajero = req.body.idCajero;
    var auth = req.body.auth;
    var tipo = req.body.tipo;
    var fecha = req.body.fecha;
    if (tipo == 1)
        fecha = fecha.split(' ')[0];
    validar.token(idCajero, auth, idplataforma, imei, res, function (autorizado) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_OBTENER_COMPRAS + (tipo == 0 ? 'AND com.id_compra_estado < 100' : 'AND fecha = ? AND com.id_compra_estado >= 100') + ' ORDER BY IFNULL(id_compra, 0) DESC;', [idCajero, fecha], function (cajeros) {
            return res.status(200).send({ estado: 1, cajeros: cajeros });
        }, res);
    });
}

router.post('/listar-en-camino/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return listarEnCamino(req, res, idplataforma, imei);
});

var STORE_OBTENER_EN_CAMINO =
    "SELECT com.acreditado, com.id_despacho, cl.on_line, com.id_direccion, com.sinLeerCajero, com.sinLeerCliente, com.calificarCliente, com.calificarCajero, com.calificacionCliente, com.calificacionCajero, com.comentarioCliente, com.comentarioCajero, "
    + " com.costo_entrega AS costo_envio, com.costo, com.detalle, com.referencia, s.lt, s.lg, com.lt AS ltB, com.lg AS lgB, com.id_cajero, cl.id_cliente, cl.codigoPais, cl.celular, cl.nombres, cl.apellidos, s.img, cl.celularValidado, s.sucursal, com.id_compra_estado, IFNULL(com_es.estado, 'Consultar') AS estado, com.id_compra "
    + " FROM " + _STORE_ + ".compra com "
    + " INNER JOIN " + _STORE_ + ".compra_estado com_es ON com.id_compra_estado = com_es.id_compra_estado "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON com.id_cajero = cl.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cjs.id_cajero = com.id_cajero "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON com.id_sucursal = s.id_sucursal AND cjs.id_sucursal = s.id_sucursal "
    + " WHERE com.id_cliente = ? ";

function listarEnCamino(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_OBTENER_EN_CAMINO + 'AND calificarCliente != 2 AND com.fecha >= DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)) ORDER BY IFNULL(id_compra, 0) DESC;', [idCliente], function (cajeros) {
            return res.status(200).send({ estado: 1, cajeros: cajeros });
        }, res);
    });
}

router.post('/cancelar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return cancelar(req, res, idplataforma, imei);
});

var STORE_CANCELAR_COMPRA =
    "UPDATE " + _STORE_ + ".`compra` SET `calificarCajero` = 1, `calificarCliente` = 1, `id_compra_estado` = ?, `fecha_cancelo` = NOW() WHERE `id_compra` = ? LIMIT 1;";

function cancelar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idClienteRecibe = req.body.idClienteRecibe;
    var idClienteEnvia = req.body.idClienteEnvia;
    var envia = req.body.envia;
    var idCompra = req.body.idCompra;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let idCompraEstado = _COMPRA_CANCELADA;
        data.consultarRes(STORE_CANCELAR_COMPRA, [idCompraEstado, idCompra], function () {
            data.consultarRes(STORE_OBTENER_ID_COMPRA, [idCompra], function (cajeros) {
                let mensaje = '🚫 Compra cancelada';
                let valor = '';
                chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, '🚫 Compra cancelada', mensaje, valor, idCompraEstado, function () {
                    let mensaje = '😔 Tu compra se ha cancelado, 🙏 por favor califica tu experiencia';
                    let valor = '';
                    chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '🚫 Compra cancelada', mensaje, valor, idCompraEstado, function () {

                        idClienteEnvia = cajeros[0]['id_conductor'];
                        despacho.cancelar(req, imei, cajeros[0]['id_despacho'], idClienteEnvia, idClienteRecibe, function (respuesta) {
                            return res.status(200).send({ estado: 1, cajero: cajeros[0] });
                        }, res);

                    }, res);
                }, res);
            }, res);
        }, res);
    });
}

router.post('/ver/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return ver(req, res, idplataforma, imei);
});

function ver(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idCompra = req.body.idCompra;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_OBTENER_ID_COMPRA, [idCompra], function (cajeros) {
            return res.status(200).send({ estado: 1, cajero: cajeros[0] });
        }, res);
    });
}

var STORE_OBTENER_ID_COMPRA =
    "SELECT com.acreditado, com.id_conductor, com.id_despacho, cl.on_line, com.id_direccion, com.sinLeerCajero, com.sinLeerCliente, com.calificarCliente, com.calificarCajero, com.calificacionCliente, com.calificacionCajero, com.comentarioCliente, com.comentarioCajero, "
    + " com.costo_entrega AS costo_envio, com.costo, com.detalle, com.referencia, com.lt, com.lg, com.id_cajero, cl.id_cliente, cl.codigoPais, cl.celular, cl.nombres, cl.apellidos, cl.img, cl.celularValidado, s.sucursal, com.id_compra_estado, IFNULL(com_es.estado, 'Consultar') AS estado, com.id_compra "
    + " FROM " + _STORE_ + ".compra com "
    + " INNER JOIN " + _STORE_ + ".compra_estado com_es ON com.id_compra_estado = com_es.id_compra_estado "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON com.id_cliente = cl.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cjs.id_cajero = com.id_cajero "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON com.id_sucursal = s.id_sucursal AND cjs.id_sucursal = s.id_sucursal "
    + " WHERE com.id_compra = ? LIMIT 1;";

module.exports = router;