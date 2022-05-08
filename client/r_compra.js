var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var chatCompra = require('./chatCompra.js');
var _despacho = require('./despacho.js');

router.post('/marcar-leido/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return marcarLeidoCompra(req, res, idplataforma, imei);
});

const STORE_MARCAR_LEIDO_CLIENTE =
    "UPDATE " + _STORE_ + ".`compra` SET `sinLeerCliente` = 0 WHERE `id_compra` = ? LIMIT 1;";

const STORE_MARCAR_LEIDO_CAJERO =
    "UPDATE " + _STORE_ + ".`compra` SET `sinLeerCajero` = 0 WHERE `id_compra` = ? LIMIT 1;";

function marcarLeidoCompra(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idCompra = req.body.idCompra;
    var auth = req.body.auth;
    var tipo = req.body.tipo;
    var SQL_ = '';
    if (tipo == _TIPO_CLIENTE)
        SQL_ = STORE_MARCAR_LEIDO_CLIENTE;
    else if (tipo == _TIPO_ASESOR)
        SQL_ = STORE_MARCAR_LEIDO_CAJERO;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(SQL_, [idCompra], function () {
            return res.status(200).send({ estado: 1 });
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

const STORE_OBTENER_ID_COMPRA =
    "SELECT com.acreditado, IFNULL(com.id_despacho, 0) AS id_despacho, cj.on_line, com.id_direccion, com.sinLeerCajero, com.sinLeerCliente, com.calificarCliente, com.calificarCajero, com.calificacionCliente, com.calificacionCajero, com.comentarioCliente, com.comentarioCajero, "
    + " com.costo_entrega AS costo_envio, com.costo, com.detalle, com.referencia, s.lt, s.lg, com.lt AS ltB, com.lg AS lgB, com.id_cajero, cj.id_cliente, cj.codigoPais, cj.celular, cj.nombres, cj.apellidos, cj.img, cj.celularValidado, sc.sucursal, s.sucursal AS suc_venta, com.id_compra_estado, IFNULL(com_es.estado, 'Consultar') AS estado, com.id_compra "
    + " FROM " + _STORE_ + ".compra com "
    + " INNER JOIN " + _STORE_ + ".compra_estado com_es ON com.id_compra_estado = com_es.id_compra_estado "
    + " INNER JOIN " + _STORE_ + ".cliente cj ON com.id_cajero = cj.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cjs.id_cajero = com.id_cajero "
    + " INNER JOIN " + _STORE_ + ".sucursal sc ON cjs.id_sucursal = sc.id_sucursal "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = com.id_sucursal "
    + " WHERE com.id_compra = ? LIMIT 1;";

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

router.post('/listar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return listar(req, res, idplataforma, imei);
});

const STORE_OBTENER_COMPRAS =
    "SELECT com.acreditado, com.id_despacho, cj.on_line, com.id_direccion, com.sinLeerCajero, com.sinLeerCliente, com.calificarCliente, com.calificarCajero, com.calificacionCliente, com.calificacionCajero, com.comentarioCliente, com.comentarioCajero, "
    + " com.costo_entrega AS costo_envio, IFNULL(com.costo, 0.0) AS costo,"
    + " IFNULL(com.detalle, '') AS detalle, s.id_sucursal, "
    + " com.referencia, s.lt, s.lg, com.lt AS ltB, com.lg AS lgB, com.id_cajero, com.id_cliente, cj.codigoPais, cj.celular, cj.nombres, cj.apellidos, s.img, s.sucursal, "
    + " com.id_compra_estado, IFNULL(com_es.estado, 'Consultar') AS estado, com.id_compra "
    + " FROM " + _STORE_ + ".compra com "
    + " INNER JOIN " + _STORE_ + ".compra_estado com_es ON com.id_compra_estado = com_es.id_compra_estado "
    + " INNER JOIN " + _STORE_ + ".cliente cj ON com.id_cajero = cj.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal_cajero cjs ON cjs.id_cajero = com.id_cajero "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON com.id_sucursal = s.id_sucursal AND cjs.id_sucursal = s.id_sucursal "
    + " WHERE com.id_cliente = ? AND com.anio = ? AND com.mes = ? AND com.visible = 1 ORDER BY IFNULL(id_compra, 0) DESC;";

function listar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var anio = req.body.anio;
    var mes = req.body.mes;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_OBTENER_COMPRAS, [idCliente, anio, mes], function (cajeros) {
            return res.status(200).send({ estado: 1, cajeros: cajeros });
        }, res);
    });
}

router.post('/inciar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var idaplicativo = req.headers.idaplicativo;
    return iniciar(req, res, idaplicativo, idplataforma, imei);
});

const STORE_INICIAR_COMPRA =
    "INSERT INTO " + _STORE_ + ".compra (id_despacho, id_aplicativo, id_sucursal, id_cliente, id_cajero, id_compra_estado, id_direccion, referencia, lt, lg, costo_entrega, id_hashtag, hashtag, descontado, meta, anio, mes, fecha) "
    + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, YEAR(NOW()), MONTH(IFNULL(CONVERT_TZ(NOW(),'UTC',?), NOW()) ), IFNULL(CONVERT_TZ(NOW(),'UTC',?), NOW()) ) ;";

var STORE_REGISTRAR_PROMOCION =
    "INSERT IGNORE INTO " + _STORE_ + ".`compra_promocion` (`id_compra`, `id_promocion`, `incentivo`, `producto`, `descripcion`, `precio`, `cantidad`, `total`, `imagen`) VALUES ";

const STORE_SALUDO =
    "SELECT REPLACE(s.saludo, '$-CAJERO-$', c.nombres) AS saludo FROM " + _STORE_ + ".sucursal s INNER JOIN " + _STORE_ + ".sucursal_cajero sc ON s.id_sucursal = sc.id_sucursal INNER JOIN " + _STORE_ + ".cliente c ON sc.id_cajero = c.id_cliente WHERE s.id_sucursal = ? LIMIT 1;";

function iniciar(req, res, idaplicativo, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idSucursal = req.body.idSucursal;
    var idCajero = req.body.idCajero;
    var auth = req.body.auth;
    var idDireccion = req.body.idDireccion;
    var referencia = req.body.referencia;
    if (!referencia || referencia == "null" || referencia == null) {
        referencia = 'Ubicación en mapa';
        req.body.referencia = 'Ubicación en mapa';
    }
    var lt = req.body.lt;
    var lg = req.body.lg;
    var costoEntrega = req.body.costoEntrega;
    var idDespacho = 0;

    var aCobrar = req.body.aCobrar;//Lo que se cobrara al cliente
    if (!aCobrar || aCobrar == "null" || aCobrar == null || isNaN(aCobrar))
        aCobrar = costoEntrega;
    costoEntrega = aCobrar;

    var descontado = req.body.descontado;//Valor q se desconto por saldo money
    if (!descontado || descontado == "null" || descontado == null || isNaN(descontado))
        descontado = 0.0;

    var idHashtag = req.body.idHashtag;//idHashtag del Hashtag que se uso para recibir un descuento
    if (!idHashtag || idHashtag == "null" || idHashtag == null || isNaN(idHashtag))
        idHashtag = 0;

    var hashtag = req.body.descuento;//valor del hashtag que se uso para recibir un descuento
    if (!hashtag || hashtag == "null" || hashtag == null || isNaN(hashtag))
        hashtag = 0.0;

    hashtag = hashtag - descontado; //Se da preferencia al descuento del saldo money el hastag aplica solo si no hay saldo money
    if (hashtag <= 0)
        hashtag = 0.0;

    req.body.descuento = hashtag;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;

        let idCompraEstado = _COMPRA_REFERENCIADA;
        var ipInfo = req.ipInfo;
        var timezone;
        try {
            timezone = ipInfo['timezone'];
        } catch (err) {
            timezone = _TIME_ZONE;
        }
        if (!timezone)
            timezone = _TIME_ZONE;
        var meta = { 'headers': req.headers, 'ipInfo': req.ipInfo };
        verificarHorario(idSucursal, function (respuesta) {

            if (respuesta['abierto'] == false) {
                return res.status(200).send({ estado: -1, error: 'Lo sentimos pero la sucursal acabo de cerrar.' });
            }

            data.consultarRes(STORE_INICIAR_COMPRA, [idDespacho, idaplicativo, idSucursal, idCliente, idCajero, idCompraEstado, idDireccion, referencia, lt, lg, aCobrar, idHashtag, hashtag, descontado, JSON.stringify(meta), timezone, timezone], function (respuesta) {
                data.consultarRes(STORE_SALUDO, [idSucursal], function (saludos) {
                    if (saludos.length <= 0)
                        return res.status(200).send({ estado: -1, error: 'Lo sentimos ocurrió un problema, intenta de nuevo más tarde. ' });

                    let idCompra = respuesta['insertId'];
                    let valor = '';
                    let mensaje = '👋 Iniciada';
                    chatCompra.enviarChat(req, imei, idCompra, idCajero, idCliente, _CHAT_ENVIA_CLIENTE, _CHAT_TIPO_LINE, '👋 Nueva compra', mensaje, valor, idCompraEstado, function () {
                        data.consultarRes(STORE_OBTENER_ID_COMPRA, [idCompra], function (cajeros) {
                            mensaje = saludos[0]['saludo'];
                            let detalle = `${cajeros[0]['suc_venta']}\n`;
                            return chatCompra.enviarChat(req, imei, idCompra, idCliente, idCajero, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '👋 Nueva compra', mensaje, valor, idCompraEstado, function () {
                                var pr = JSON.parse(req.body.promociones);
                                var SQL_ = '';
                                for (var i = 0; i < pr.length; i++) {
                                    if (pr[i]['dt'] == '' || !pr[i]['dt'])
                                        detalle += `${pr[i]['cantidad']} ${pr[i]['producto']} ${pr[i]['costoTotal']} USD \n`;
                                    else
                                        detalle += `${pr[i]['cantidad']} ${pr[i]['producto']} ${pr[i]['costoTotal']} USD \n(${pr[i]['dt']}) \n`;
                                    if (i == 0)
                                        SQL_ += ` (${idCompra}, '${pr[i]['id_promocion']}', '${pr[i]['incentivo']}','${pr[i]['producto']}','${pr[i]['descripcion']}','${pr[i]['precio']}','${pr[i]['cantidad']}',${pr[i]['costoTotal']},'${pr[i]['imagen']}')`;
                                    else
                                        SQL_ += `,(${idCompra}, '${pr[i]['id_promocion']}', '${pr[i]['incentivo']}','${pr[i]['producto']}','${pr[i]['descripcion']}','${pr[i]['precio']}','${pr[i]['cantidad']}',${pr[i]['costoTotal']},'${pr[i]['imagen']}')`;
                                }
                                req.body.idCompra = idCompra;
                                req.body.detalle = detalle;
                                data.consultarRes(STORE_REGISTRAR_PROMOCION + SQL_ + ';', [], function () {
                                    return realizar(req, res, idplataforma, imei);
                                }, res);
                            }, res);
                        }, res);
                    }, res);
                }, res);
            }, res);
        }, res);
    });

}

const STORE_SURSALES_HORARIO =
    "SELECT sh.id_sucursal FROM " + _STORE_ + ".sucursal_horario sh WHERE sh.id_sucursal = ? AND sh.activo = 1 AND DATE_FORMAT(CONVERT_TZ(NOW(),'UTC', sh.TZ),'%w') = sh.dia AND ((sh.tipo = 1 AND ( SELECT MAX(id_sucursal) FROM " + _STORE_ + ".sucursal_horario shaux WHERE shaux.id_sucursal = sh.id_sucursal AND shaux.activo = 1 AND shaux.tipo = 2 AND DATE_FORMAT(CONVERT_TZ(NOW(),'UTC', sh.TZ),'%w') = shaux.dia) IS NULL ) OR (sh.tipo = 2 AND DATE(CONVERT_TZ(NOW(),'UTC', sh.TZ)) = sh.fecha ) ) AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) >= sh.desde AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) <= sh.hasta LIMIT 1;";

function verificarHorario(idSucursal, callback, res) {
    data.consultarRes(STORE_SURSALES_HORARIO, [idSucursal], function (horarios) {
        if (horarios.length > 0)
            return callback({ abierto: true });
        return callback({ abierto: false })
    }, res);
}

const STORE_REALIZAR_COMPRA =
    "UPDATE " + _STORE_ + ".`compra` SET `id_compra_estado` = ?, `fecha_comprada` = NOW(), id_cash = ?, cash = ?, id_forma_pago = ?, id_cupon = ?, credito = ?, credito_producto = ?, credito_envio = ?, `costo` = ?, costo_producto = ?, costo_entrega = ?, transaccion = ?, `detalle` = ?, `id_chat` = ? WHERE `id_compra` = ? LIMIT 1;";

const STORE_MENSAJE_AGENCIA =
    "SELECT s.id_agencia, a.mensaje FROM " + _STORE_ + ".compra c INNER JOIN " + _STORE_ + ".sucursal s ON c.id_sucursal = s.id_sucursal INNER JOIN " + _STORE_ + ".agencia a ON a.id_agencia = s.id_agencia WHERE c.id_compra = ? LIMIT 1;";

const STORE_REGISTRAR_VENTAS =
    "UPDATE " + _STORE_ + ".`agencia` SET `ventas` = ventas + 1 WHERE `id_agencia` = ? LIMIT 1;";

function realizar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var tipo = req.body.tipo;
    var idCajero = req.body.idCajero;
    var idCompra = req.body.idCompra;
    var detalle = req.body.detalle;
    var idChat = req.body.idChat;
    var costoEntrega = req.body.costoEntrega;
    var costoTotal = req.body.costoTotal;
    var credito = req.body.credito;
    var idCash = req.body.idCash;
    var cash = req.body.cash;
    var creditoProducto = req.body.creditoProducto;
    var creditoEnvio = req.body.creditoEnvio;
    var idCupon = req.body.idCupon;

    if (!idCash)
        idCash = 0;
    if (!cash)
        cash = 0.0;
    if (!credito)
        credito = 0.0;
    if (!creditoProducto)
        creditoProducto = 0.0;
    if (!creditoEnvio)
        creditoEnvio = 0.0;
    if (!idCupon)
        idCupon = 0;

    var idFormaPago = req.body.idFormaPago;
    if (!idFormaPago)
        idFormaPago = 10; //Forma de pago por defecto es Efectivo

    var ipInfo = req.ipInfo;
    var timezone;
    try {
        timezone = ipInfo['timezone'];
    } catch (err) {
        timezone = 'UTC';
    }

    var transaccion = req.body.transaccion; //Valor que se descuenta al cliente para pagar por la emrpesa a la moto
    if (!transaccion || transaccion == "null" || transaccion == null || isNaN(transaccion))
        transaccion = 0.0;

    var hashtag = req.body.descuento;
    if (!hashtag || hashtag == "null" || hashtag == null || isNaN(hashtag))
        hashtag = 0.0;

    var descontado = req.body.descontado; //Valor q se desconto por saldo money (money solo cubre costo de envio)
    if (!descontado || descontado == "null" || descontado == null || isNaN(descontado))
        descontado = 0.0;

    costoEntrega = (costoEntrega - transaccion - hashtag - descontado);

    if (costoEntrega <= 0)
        costoEntrega = 0.0;

    costoTotal = costoTotal - transaccion - hashtag - descontado;
    transaccion = parseFloat(transaccion) + parseFloat(hashtag) + parseFloat(descontado);

    if (descontado <= 0)
        descontado = 0.0;

    let idCompraEstado = _COMPRA_COMPRADA;
    let costoProductos = costoTotal - costoEntrega;

    credito = parseFloat(credito) - parseFloat(transaccion); //Restamos los descuentos de envios. Aplicamos descuentos.
    creditoEnvio = parseFloat(creditoEnvio) - parseFloat(transaccion); //Restamos los descuentos de envios. Aplicamos descuentos.


    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    if (idFormaPago > 10 && (hashtag > 0 || transaccion > 0)) {
        //Al usar descuento por # se resta primero el envio si el cupon cubre menos del valor total pero mas del valor del producto da conflico. PARCHE
        creditoProducto = parseFloat(creditoProducto) + parseFloat(hashtag) + parseFloat(transaccion);
        if (creditoProducto > costoProductos)
            creditoProducto = costoProductos;
        credito = parseFloat(credito) + parseFloat(hashtag) + parseFloat(transaccion);
        if (credito > costoTotal)
            credito = costoTotal;
    }
    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    //IMPORTANTE EL ORDEN 
    if (idFormaPago > 10) {
        transaccion = transaccion + creditoEnvio   //Cuando es una forma de pago donde no se usa efectivo se acredita a la moto el saldo como credito
    }
    if (credito < 0)
        credito = 0.0;
    if (creditoEnvio < 0)
        creditoEnvio = 0.0;
    //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    //Si se usa cash se sobre escribe la forma de pago como tarjeta
    //IMPORTANTE EL ORDEN 
    if (cash > 0)
        idFormaPago = 23;

    data.consultarRes(STORE_REALIZAR_COMPRA, [idCompraEstado, idCash, cash, idFormaPago, idCupon, credito, creditoProducto, creditoEnvio, costoTotal, costoProductos, costoEntrega, transaccion, detalle, idChat, idCompra], function () {
        let mensaje = '🤝 Confirmada';
        let valor = '';
        chatCompra.enviarChat(req, imei, idCompra, idCajero, idCliente, _CHAT_ENVIA_CLIENTE, _CHAT_TIPO_LINE, '🤝 Confirmada', mensaje, valor, idCompraEstado, function () {
            let mensaje = detalle;
            let valor = costoTotal;
            chatCompra.enviarChat(req, imei, idCompra, idCliente, idCajero, _CHAT_ENVIA_CLIENTE, global._CHAT_TIPO_CONFIRMACION, '🤝', mensaje, valor, idCompraEstado, function () {

                data.consultarRes(STORE_MENSAJE_AGENCIA, [idCompra], function (agencias) {
                    if (agencias.length <= 0)
                        return res.status(200).send({ estado: -1, error: 'Ups, intenta de nuevo mas tarde' });

                    let valor = '';
                    let mensaje = agencias[0]['mensaje'];
                    let idAgencia = agencias[0]['id_agencia'];
                    data.consultar(STORE_REGISTRAR_VENTAS, [idAgencia]);
                    chatCompra.enviarChat(req, imei, idCompra, idCliente, idCajero, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '🤝 Confirmada', mensaje, valor, idCompraEstado, function () {
                        data.consultarRes(STORE_OBTENER_ID_COMPRA, [idCompra], function (cajeros) {
                            let cajero = cajeros[0];
                            var idaplicativo = req.headers.idaplicativo;
                            let idDespachoEstado = 1;
                            let ruta = { t: 3 };
                            let meta = { headers: req.headers, ipInfo: req.ipInfo };
                            let despacho = { a: cajero['sucursal'], b: cajero['nombres'], d: cajero['detalle'], r: cajero['referencia'], c: cajero['costo'], ce: cajero['costo_envio'] };
                            let ltB = cajero['ltB'], lgB = cajero['lgB'], ltA = cajero['lt'], lgA = cajero['lg'];

                            if (tipo == _TIPO_ENCOMIENDA) {
                                ltA = req.body.ltE;
                                lgA = req.body.lgE;
                            }

                            _despacho.iniciar(req, imei, idaplicativo, idCompra, idCliente, idDespachoEstado, cajero['costo'], cajero['costo_envio'], ltA, lgA, ltB, lgB, despacho, ruta, timezone, meta, function (respuesta) {
                                cajero['id_despacho'] = respuesta['idDespacho'];
                                return res.status(200).send({ estado: 1, cajero: cajero });
                            }, res);
                        }, res);
                    }, res);
                }, res);
                let idFactura = req.body.idFactura;
                if (idFactura <= 0)
                    return;
                valor = idFactura;
                mensaje = `Datos de factura\n${req.body.factura}`;
                chatCompra.enviarChat(req, imei, idCompra, idCajero, idCliente, _CHAT_ENVIA_CLIENTE, _CHAT_TIPO_TEXTO, '🧾 Facturar', mensaje, valor, idCompraEstado, function () {
                }, null);
            }, res);
        }, res);
    }, res);

}

router.post('/calificar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return calificar(req, res, idplataforma, imei);
});

const STORE_CALIFICA_CLIENTE_COMPRA =
    "UPDATE " + _STORE_ + ".`compra` SET `calificarCliente` = 2, `calificacionCliente` = ?, `comentarioCliente` = ?, `fecha_califico_cliente` = NOW() WHERE `id_compra` = ? LIMIT 1;";

const STORE_CALIFICA_CAJERO_COMPRA =
    "UPDATE " + _STORE_ + ".`compra` SET `calificarCajero` = 2, `calificacionCajero` = ?, `comentarioCajero` = ?, `fecha_califico_cajero` = NOW() WHERE `id_compra` = ? LIMIT 1;";

function calificar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var calificacion = 0;
    var comentario = '';
    var tipo = req.body.tipo;
    var idCompra = req.body.idCompra;
    var auth = req.body.auth;
    var SQL_ = '';
    if (tipo == _TIPO_CLIENTE) {
        SQL_ = STORE_CALIFICA_CLIENTE_COMPRA;
        calificacion = req.body.calificacionCliente;
        comentario = req.body.comentarioCliente;

    } else if (tipo == _TIPO_ASESOR) {
        SQL_ = STORE_CALIFICA_CAJERO_COMPRA;
        calificacion = req.body.calificacionCajero;
        comentario = req.body.comentarioCajero;
    }
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(SQL_, [calificacion, comentario, idCompra], function () {
            data.consultarRes(STORE_OBTENER_ID_COMPRA, [idCompra], function (cajeros) {
                return res.status(200).send({ estado: 1, error: 'Gracias por tu comentario.', cajero: cajeros[0] });
            }, res);
        }, res);
    });
}

//Lista los promociones de la compra
router.post('/listar-promociones', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return listarPromociones(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function listarPromociones(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idCompra = req.body.idCompra;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VER_PROMOCIONES, [idCompra], function (promociones) {
            return res.status(200).send({ estado: 1, promociones: promociones });
        }, res);
    });
}

var STORE_VER_PROMOCIONES =
    "SELECT id_compra, id_promocion, incentivo, producto, descripcion, precio, cantidad, total, imagen FROM "
    + _STORE_ + ".compra_promocion p WHERE p.id_compra = ?;";

module.exports = router;