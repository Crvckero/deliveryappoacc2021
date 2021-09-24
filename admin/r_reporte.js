var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var store = require('./store');

router.post('/compras/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return compras(req, res, idplataforma, imei);
});

function compras(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idAgencia = req.body.idAgencia;
    var fecha = req.body.fecha;

    var fechas = fecha.split('-');
    if (fechas.length <= 1)
        return res.status(200).send({ estado: 1, ventas: [] });
    let anio = fechas[0];
    let mes = fechas[1];

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let cio = cliente['cio'];
        data.consultarRes(STORE_COMPRAS, [anio, mes, idAgencia, idAgencia, idAgencia, cio, idCliente, idCliente], function (compras) {
            return res.status(200).send({ estado: 1, compras: compras });
        }, res);
    });
}

const STORE_COMPRAS =
    "SELECT DATE_FORMAT(c.fecha, '%Y %b %d') AS fecha, COUNT(*) AS total, SUM(IF(c.id_compra_estado = 2, 1, 0)) AS consultando, SUM(IF(c.id_compra_estado = 3, 1, 0)) AS comprada, SUM(IF(c.id_compra_estado = 4, 1, 0)) AS despachada, SUM(IF(c.id_compra_estado = 100, 1, 0)) AS cancelada, SUM(IF(c.id_compra_estado = 200, 1, 0)) AS entragda "
    + " FROM " + _STORE_ + ".compra c "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = c.id_sucursal "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + ` WHERE c.anio = ? AND c.mes = ? AND ( ((? != -1) AND ( a.id_agencia = ?)) OR ((? = -1) AND (? = 1 OR a.id_agencia IN ${store.AGENCIA} OR a.id_agencia IN ${store.AGENCIA_POR_SUCURSAL}))) GROUP BY c.fecha;`;


router.post('/ventas/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return ventas(req, res, idplataforma, imei);
});

function ventas(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idAgencia = req.body.idAgencia;
    var fecha = req.body.fecha;

    var fechas = fecha.split('-');
    if (fechas.length <= 1)
        return res.status(200).send({ estado: 1, ventas: [] });
    let anio = fechas[0];
    let mes = fechas[1];

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let cio = cliente['cio'];
        data.consultarRes(STORE_VENTAS, [anio, mes, idAgencia, idAgencia, idAgencia, cio, idCliente, idCliente], function (ventas) {
            return res.status(200).send({ estado: 1, ventas: ventas });
        }, res);
    });
}

const STORE_VENTAS =
    "SELECT fp.forma_pago, SUM(v.ventas) AS ventas, SUM(v.credito) AS credito, SUM(v.credito_producto) AS credito_producto, SUM(v.credito_envio) AS credito_envio, SUM(v.costo) AS costo, SUM(v.costo_producto) AS costo_producto, SUM(v.costo_entrega) AS costo_producto, SUM(v.hashtag) AS hashtag, SUM(v.descontado) AS descontado, SUM(v.transaccion) AS transaccion, SUM(v.ingresos) AS ingresos, SUM(v.devuelto) AS devuelto "
    + " FROM " + _STORE_ + "_rubro.venta v "
    + " INNER JOIN " + _STORE_ + ".forma_pago fp ON v.id_forma_pago = fp.id_forma_pago "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = v.id_sucursal "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + ` WHERE v.anio = ? AND v.mes = ? AND ( ((? != -1) AND ( a.id_agencia = ?)) OR ((? = -1) AND (? = 1 OR a.id_agencia IN ${store.AGENCIA} OR a.id_agencia IN ${store.AGENCIA_POR_SUCURSAL}))) GROUP BY v.id_forma_pago;`;


module.exports = router;