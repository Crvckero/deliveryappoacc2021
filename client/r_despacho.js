var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');
var chatCompra = require('./chatCompra.js');
var chatDespacho = require('./chatDespacho.js');
var _cajero = require('./cajero.js');
var _despacho = require('./despacho.js');

router.post('/marcar-leido/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return marcarLeidoDespacho(req, res, idplataforma, imei);
});

const STORE_MARCAR_LEIDO_CLIENTE =
    "UPDATE " + _STORE_ + ".`despacho` SET `sinLeerCliente` = 0 WHERE `id_despacho` = ? LIMIT 1;";

const STORE_MARCAR_LEIDO_CONDUCTOR =
    "UPDATE " + _STORE_ + ".`despacho` SET `sinLeerConductor` = 0 WHERE `id_despacho` = ? LIMIT 1;";

function marcarLeidoDespacho(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    var tipo = req.body.tipo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var SQL_ = '';
        if (tipo == _TIPO_CLIENTE)
            SQL_ = STORE_MARCAR_LEIDO_CLIENTE;
        else if (tipo == _TIPO_CONDUCTOR)
            SQL_ = STORE_MARCAR_LEIDO_CONDUCTOR;
        data.consultarRes(SQL_, [idDespacho], function () {
            return res.status(200).send({ estado: 1 });
        }, res);
    });
}

router.post('/listar-despachos/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return listarDespachos(req, res, idplataforma, imei);
});

var STORE_LISTAR_DESPACHOS_ALL =
    "SELECT des.preparandose, fp.forma_pago, des.tipo, IFNULL(des.despacho->>'$.conE', s.contacto) AS telSuc, cl.correctos, cl.on_line, cl.celularValidado, des.ltA, des.lgA, des.ltB, des.lgB, des.despacho, des.ruta, des.id_compra, des.sinLeerConductor, des.sinLeerCliente, des.calificarCliente, des.calificarConductor, des.calificacionCliente, des.calificacionConductor, des.comentarioCliente, des.comentarioConductor, "
    + " c.costo_producto, c.credito, c.credito_producto, c.credito_envio, c.costo_entrega AS costo_envio, c.costo, des.id_conductor, des.id_cliente, cl.codigoPais, cl.celular, IFNULL(cl.nombres, 'Sin conductor') AS nombres, cl.img, des.id_despacho_estado, IFNULL(com_es.estado, 'Consultar') AS estado, des.id_despacho "
    + " FROM " + _STORE_ + ".despacho des "
    + " INNER JOIN " + _STORE_ + ".despacho_estado com_es ON des.id_despacho_estado = com_es.id_despacho_estado "
    + " INNER JOIN " + _STORE_ + ".compra c ON des.id_compra = c.id_compra "
    + " INNER JOIN " + _STORE_ + ".forma_pago fp ON fp.id_forma_pago = c.id_forma_pago "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON des.id_cliente = cl.id_cliente "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = c.id_sucursal "
    + " WHERE ";

var STORE_LISTAR_DESPACHOS_RESTRIC =
    'SELECT des.preparandose, fp.forma_pago, des.tipo, IFNULL(des.despacho->>"$.conE", s.contacto) AS telSuc, cl.correctos, cl.on_line, cl.celularValidado, des.ltA, des.lgA, des.ltB, des.lgB, des.despacho, des.ruta, des.id_compra, des.sinLeerConductor, des.sinLeerCliente, des.calificarCliente, des.calificarConductor, des.calificacionCliente, des.calificacionConductor, des.comentarioCliente, des.comentarioConductor, '
    + ' c.costo_producto, c.credito, c.credito_producto, c.credito_envio, c.costo_entrega AS costo_envio, c.costo, des.id_conductor, des.id_cliente, cl.codigoPais, cl.celular, IFNULL(cl.nombres, "Sin conductor") AS nombres, cl.img, des.id_despacho_estado, IFNULL(com_es.estado, "Consultar") AS estado, des.id_despacho '
    + ' FROM ' + _STORE_ + '.despacho des '
    + ' INNER JOIN ' + _STORE_ + '.despacho_estado com_es ON des.id_despacho_estado = com_es.id_despacho_estado '
    + ' INNER JOIN ' + _STORE_ + '.compra c ON des.id_compra = c.id_compra '
    + " INNER JOIN " + _STORE_ + ".forma_pago fp ON fp.id_forma_pago = c.id_forma_pago "
    + ' INNER JOIN ' + _STORE_ + '.cliente cl ON des.id_cliente = cl.id_cliente '
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = c.id_sucursal "
    + " INNER JOIN " + _STORE_ + ".agencia a ON s.id_agencia = a.id_agencia "
    + " INNER JOIN " + _STORE_ + ".aplicativo ap ON c.id_aplicativo = ap.id_aplicativo "

    + ' LEFT JOIN ' + _STORE_ + '.cliente_settings cst ON cst.id_cliente = ? '

    //Cuando la agencia no tiene restriccion se notifica a las motos que no tengan " + _STORE_ + ".cliente_settings
    //Cuando la agencia tiene restriccion se notifica solo a las motos que tengan " + _STORE_ + ".cliente_settings a esa agencia
    //Si el aplicativo esta restringido (ap.restringir = 1) no se lista aun cuando la agencia no esta restringida 
    + ' WHERE '
    + `   (  ( des.id_despacho_estado = 1 AND ( (a.restriccion = 0 AND cst.id_cliente IS NULL AND ap.restringir = 0) OR (JSON_SEARCH(cst.settings->"$.lA", "all", a.id_agencia) IS NOT NULL)  )) `;

function listarDespachos(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var tipo = req.body.tipo;
    var fecha = req.body.fecha;
    var idaplicativo = req.headers.idaplicativo;
    fecha = fecha.split(' ')[0];
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var idUrbe = cliente['id_urbe'];
        let _SQL;
        let _ARGS;
        if (tipo == 1) { //Tab de historial
            _SQL = STORE_LISTAR_DESPACHOS_ALL + '(des.id_conductor = ?) AND des.fecha = ? ORDER BY des.id_despacho DESC;';
            _ARGS = [idCliente, fecha];
        } else { //Tab principal
            if (cliente['rastrear'] == 1) {
                _SQL = STORE_LISTAR_DESPACHOS_RESTRIC + ' OR (des.id_conductor = ? AND des.id_despacho_estado > 1 AND des.id_despacho_estado <= 3) ) AND s.id_urbe = ? ORDER BY c.id_compra_estado DESC, des.id_despacho ASC LIMIT 20;';
                _ARGS = [idCliente, idCliente, idUrbe];
            }
            else {
                _SQL = STORE_LISTAR_DESPACHOS_ALL + '(des.id_conductor = ? AND des.id_despacho_estado <= 3) ORDER BY des.id_despacho DESC;';
                _ARGS = [idCliente];
            }
        }
        data.consultarRes(_SQL, _ARGS, function (despachos) {
            return res.status(200).send({ estado: 1, despachos: despachos });
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
    var auth = req.body.auth;
    var idDespacho = req.body.idDespacho;
    var tipo = req.body.tipo;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var SQL_ = '';
        if (tipo == _TIPO_CONDUCTOR)
            SQL_ = STORE_LISTAR_ID_DESPACHO_CLIENTE;
        else if (tipo == _TIPO_CLIENTE)
            SQL_ = STORE_LISTAR_ID_DESPACHO_CONDUCTOR;
        else if (tipo == _TIPO_ASESOR)
            SQL_ = STORE_LISTAR_ID_DESPACHO_CONDUCTOR;

        data.consultarRes(SQL_, [idDespacho], function (despachos) {
            if (despachos.length <= 0)
                return res.status(200).send({ estado: -1, error: 'Estamos buscado un despachador' });
            return res.status(200).send({ estado: 1, despacho: despachos[0] });
        }, res);
    });
}

const STORE_LISTAR_ID_DESPACHO_CONDUCTOR =
    "SELECT  des.preparandose, fp.forma_pago, des.tipo, IFNULL(des.despacho->>'$.conE', s.contacto) AS telSuc, cl.correctos, c.id_cajero, IFNULL(cs.lt, 0.0) AS lt, IFNULL(cs.lg, 0.0) AS lg, IFNULL(cl.on_line, 0) AS on_line, cl.celularValidado, des.ltA, des.lgA, des.ltB, des.lgB, des.despacho, des.ruta, des.id_compra, des.sinLeerConductor, des.sinLeerCliente, des.calificarCliente, des.calificarConductor, des.calificacionCliente, des.calificacionConductor, des.comentarioCliente, des.comentarioConductor, "
    + " c.costo_producto, c.credito, c.credito_producto, c.credito_envio, c.costo_entrega AS costo_envio, c.costo, des.id_conductor, des.id_cliente, cl.codigoPais, cl.celular, IFNULL(cl.nombres, 'Sin conductor') AS nombres, cl.img, des.id_despacho_estado, IFNULL(com_es.estado, 'Consultar') AS estado, des.id_despacho "
    + " FROM " + _STORE_ + ".despacho des "
    + " INNER JOIN " + _STORE_ + ".despacho_estado com_es ON des.id_despacho_estado = com_es.id_despacho_estado "
    + " INNER JOIN " + _STORE_ + ".compra c ON des.id_compra = c.id_compra "
    + " INNER JOIN " + _STORE_ + ".forma_pago fp ON fp.id_forma_pago = c.id_forma_pago "
    + " LEFT JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = c.id_sucursal "
    + " LEFT JOIN " + _STORE_ + ".cliente cl ON des.id_conductor = cl.id_cliente "
    + " LEFT JOIN " + _STORE_ + ".cliente_session cs ON cl.id_cliente = cs.id_cliente AND cs.rastrear = 1 "
    + " WHERE des.id_despacho = ? LIMIT 1;";

const STORE_LISTAR_ID_DESPACHO_CLIENTE =
    "SELECT des.preparandose, fp.forma_pago, des.tipo, IFNULL(des.despacho->>'$.conE', s.contacto) AS telSuc, cl.correctos, c.id_cajero, 0.0 AS lt, 0.0 AS lg, cl.on_line, cl.celularValidado, des.ltA, des.lgA, des.ltB, des.lgB, des.despacho, des.ruta, des.id_compra, des.sinLeerConductor, des.sinLeerCliente, des.calificarCliente, des.calificarConductor, des.calificacionCliente, des.calificacionConductor, des.comentarioCliente, des.comentarioConductor, "
    + " c.costo_producto, c.credito, c.credito_producto, c.credito_envio, c.costo_entrega AS costo_envio, c.costo, des.id_conductor, des.id_cliente, cl.codigoPais, cl.celular, IFNULL(cl.nombres, 'Sin conductor') AS nombres, cl.img, des.id_despacho_estado, IFNULL(com_es.estado, 'Consultar') AS estado, des.id_despacho "
    + " FROM " + _STORE_ + ".despacho des "
    + " INNER JOIN " + _STORE_ + ".despacho_estado com_es ON des.id_despacho_estado = com_es.id_despacho_estado "
    + " INNER JOIN " + _STORE_ + ".compra c ON des.id_compra = c.id_compra "
    + " INNER JOIN " + _STORE_ + ".forma_pago fp ON fp.id_forma_pago = c.id_forma_pago "
    + " INNER JOIN " + _STORE_ + ".cliente cl ON des.id_cliente = cl.id_cliente "
    + " LEFT JOIN " + _STORE_ + ".sucursal s ON s.id_sucursal = c.id_sucursal "
    + " WHERE des.id_despacho = ? LIMIT 1;";

router.post('/iniciar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return iniciar(req, res, idplataforma, imei);
});

const STORE_INICIAR_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET `id_despacho_estado` = ?, id_conductor = ?, `fecha_iniciado` = NOW() WHERE `id_despacho` = ? AND (id_despacho_estado = 1 OR id_conductor = ?) LIMIT 1;";

const STORE_VER_ASIGNADOS =
    "SELECT asignados FROM " + _STORE_ + ".asignado a WHERE a.id_conductor = ? LIMIT 1;";

//Si la lista esta vacia se registra y se procede a esperar 5 segundos para evaluar
const STORE_VERIFICAR_ASIGNADOS =
    "SELECT asignados FROM " + _STORE_ + ".solicitud s WHERE s.id_despacho = ? AND s.id_conductor != ? ORDER BY s.asignados DESC LIMIT 1;";

const STORE_VER_FONDOS =
    "SELECT s.id_cliente FROM " + _STORE_ + ".saldo s, " + _STORE_ + ".despacho d WHERE d.id_despacho = ? AND s.id_cliente = ? AND ROUND((s.importe * d.costo_entrega / 100 ), 2) <= s.saldo;";

function iniciar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VER_FONDOS, [idDespacho, idCliente], function (fondos) {
            if (fondos.length <= 0)
                return res.status(200).send({ estado: -1, error: 'FONDOS INSUFICIENTES =( COMPRA UNA TARJETA PARA SEGUIR POSTULANDO' });
            data.consultarRes(STORE_VER_ASIGNADOS, [idCliente], function (asigando) {
                var asignados = 0;
                if (asigando.length > 0)
                    asignados = asigando[0]['asignados'];
                if (asignados == 0)
                    return iniciarDespuesDeAlgoritmo(req, res, idplataforma, imei, cliente);//Que se atienda inmediatamente si se tienen cero pedidos asignados
                data.consultarRes(STORE_VERIFICAR_ASIGNADOS, [idDespacho, idCliente], function (asigandosConRespecto) {
                    if (asigandosConRespecto.length <= 0)
                        return registrarPeticion(req, res, idplataforma, imei, asignados, cliente); //Espero 5 segundos para llamar al hilo de atencion; Registradon la peticion de la solicitud
                    if (asigandosConRespecto[0]['asignados'] <= asignados)
                        return res.status(200).send({ estado: -1, error: 'Solicitud atendida' });
                    return registrarPeticion(req, res, idplataforma, imei, asignados, cliente); //Espero 5 segundos para llamar al hilo de atencion; Registradon la peticion de la solicitud
                }, null);
            }, res);
        }, res);
    });
}

const STORE_REGISTRAR_SOLICITUD =
    "INSERT INTO " + _STORE_ + ".`solicitud` (`id_despacho`, `id_conductor`, `asignados`) VALUES (?, ?, ?);";

function registrarPeticion(req, res, idplataforma, imei, asignados, cliente) {
    var idCliente = req.body.idCliente;
    var idDespacho = req.body.idDespacho;
    data.consultarRes(STORE_REGISTRAR_SOLICITUD, [idDespacho, idCliente, asignados], function () {
        return verificarAsignacion(req, res, idplataforma, imei, cliente);
    }, null);
}

//Si la solicitud se asigno al opportunity debe estar registrada en solicitud como de el.
const STORE_GANADOR_ASIGNADOS =
    "SELECT s.id_conductor FROM " + _STORE_ + ".solicitud s WHERE s.id_despacho = ? ORDER BY s.asignados ASC LIMIT 1;";

function verificarAsignacion(req, res, idplataforma, imei, cliente) {
    var idCliente = req.body.idCliente;
    var idDespacho = req.body.idDespacho;
    setTimeout(function () {
        data.consultarRes(STORE_GANADOR_ASIGNADOS, [idDespacho, idCliente], function (ganador) {
            if (ganador.length <= 0 || ganador[0]['id_conductor'] != idCliente)
                return res.status(200).send({ estado: -1, error: 'Solicitud atendida' });
            return iniciarDespuesDeAlgoritmo(req, res, idplataforma, imei, cliente);//Que se atienda inmediatamente si se tienen cero pedidos asignados
        }, null);
    }, 2900);
}

function iniciarDespuesDeAlgoritmo(req, res, idplataforma, imei, cliente) {
    var idCliente = req.body.idCliente;
    var idDespacho = req.body.idDespacho;
    var idaplicativo = req.headers.idaplicativo;
    let idDespachoEstado = _DESPACHO_ASIGNADO;
    //Despacho para el cliente tiene informacion dirente para pasar al conducor
    data.consultarRes(STORE_INICIAR_DESPACHO, [idDespachoEstado, idCliente, idDespacho, idCliente], function (respuesta) {
        if (respuesta['affectedRows'] <= 0)
            return res.status(200).send({ estado: -1, error: 'Solicitud atendida' });

        data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
            var despacho = despachos[0];
            let idClienteEnvia = idCliente;
            let idClienteRecibeCajero = despacho['id_cajero'];
            let idClienteRecibe = despacho['id_cliente'];
            let mensaje = '🚀 Despachador asignado';
            let valor = '';
            let idCompra = despacho['id_compra'];
            let idCompraEstado = _COMPRA_DESPACHADA;

            chatCompra.enviarChat(req, imei, idCompra, idClienteRecibeCajero, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, '🚀 Despachador asignado', mensaje, valor, idCompraEstado, function () {

                chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, '🚀 Despachador asignado', mensaje, valor, idDespachoEstado, function () {
                    let mensaje = `👋 Hola ${despacho['nombres'].split(' ')[0]} mi nombre es ${cliente['nombres'].split(' ')[0]}. 👍 Un gusto poder atenderte.`;
                    let valor = '';
                    chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '🚀 Despachador asignado', mensaje, valor, idDespachoEstado, function () {
                        return res.status(200).send({ estado: 1, despacho: despacho });
                    }, res);
                }, res);

            }, res);
        }, res);
    }, res);
}

router.post('/confirmar-notificacion/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return confirmarNotificacion(req, res, idplataforma, imei);
});

const STORE_PREPARANDOSE_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET `preparandose` = ?, `fecha_confirmo_preparandose` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

const STORE_LLEGADA_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET `llegada` = llegada + 1, `fecha_confirmo_llegada` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

const tipoNotificacionPreparacion = 1;
const tipoNotificacionFuera = 2;

function confirmarNotificacion(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idClienteRecibe = req.body.idClienteRecibe;
    var idClienteEnvia = req.body.idClienteEnvia;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    var tipoNotificacion = req.body.tipoNotificacion;

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let idDespachoEstado = _DESPACHO_RECOGIDO;
        if (tipoNotificacion == tipoNotificacionPreparacion) {
            var preparandose = req.body.preparandose;
            data.consultarRes(STORE_PREPARANDOSE_DESPACHO, [preparandose, idDespacho], function () {
                data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
                    let mensaje = `⏱️ Compra preparándose, tiempo estimado ${preparandose} min`;
                    let valor = '';
                    chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, `👩🏼‍🍳 Preparando orden. ${preparandose} min`, mensaje, valor, idDespachoEstado, function () {
                        return res.status(200).send({ estado: 1, despacho: despachos[0] });
                    }, res);
                }, res);
            }, res);
        } else if (tipoNotificacion == tipoNotificacionFuera) {
            data.consultarRes(STORE_LLEGADA_DESPACHO, [idDespacho], function () {
                data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
                    let mensaje = '🏃🏻 Porfa favor salir a recibir su pedido. 🛍️';
                    let valor = '';
                    chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '👋 Opportunity en lugar.', mensaje, valor, idDespachoEstado, function () {
                        return res.status(200).send({ estado: 1, despacho: despachos[0] });
                    }, res);
                }, res);
            }, res);
        } else {
            return res.status(200).send({ estado: -1 });
        }

    });
}

router.post('/confirmar-recogida/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return confirmarRecogida(req, res, idplataforma, imei);
});

const STORE_RECOGIDA_PAGO_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET `id_despacho_estado` = ?, `fecha_pago` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

function confirmarRecogida(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idClienteRecibe = req.body.idClienteRecibe;
    var idClienteEnvia = req.body.idClienteEnvia;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let idDespachoEstado = _DESPACHO_RECOGIDO;
        data.consultarRes(STORE_RECOGIDA_PAGO_DESPACHO, [idDespachoEstado, idDespacho], function () {
            data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
                let despacho = despachos[0];
                let mensaje = '🛍 Compra en camino';
                let valor = '';
                if (despacho['tipo'] == _TIPO_ENCOMIENDA) {
                    mensaje = '🙋🏼‍♂️ Cliente a bordo';
                }
                chatDespacho.enviarChat(req, imei, idDespacho, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, mensaje, mensaje, valor, idDespachoEstado, function () {
                    return res.status(200).send({ estado: 1, despacho: despacho });
                }, res);
            }, res);
        }, res);
    });
}

router.post('/entregar-producto/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return entregarProducto(req, res, idplataforma, imei);
});


function entregarProducto(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var tipo = req.body.tipo;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    var idClienteRecibe = req.body.idClienteRecibe;
    var idClienteEnvia = req.body.idClienteEnvia;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
            let despacho = despachos[0];
            let mensaje = '🥳 Compra entregada';
            let valor = '';
            if (despacho['tipo'] == _TIPO_ENCOMIENDA) {
                mensaje = '🙋🏼‍♂️ Cliente finalizo';
            }
            _despacho.finalizar(req, res, imei, idCliente, tipo, idDespacho, idClienteRecibe, idClienteEnvia, mensaje, function () {
                idClienteEnvia = despacho['id_cajero']; //Cambiamos el id del cliente que envia pues esta accion debe ser de el
                _cajero.confirmarPago(req, imei, despacho['id_compra'], idClienteEnvia, idClienteRecibe, function () {
                    return res.status(200).send({ estado: 1, despacho: despacho });
                }, res);
            }, res);
        });
    });
}


router.post('/calificar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return calificar(req, res, idplataforma, imei);
});


//OJO 1 es para calificar 2 es que ya se califico
const STORE_CALIFICA_CLIENTE_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET `sinLeerCliente` = 0, `calificarCliente` = 2, `calificacionCliente` = ?, `comentarioCliente` = ?, `fecha_califico_cliente` = NOW() WHERE `id_despacho` = ? LIMIT 1;";

const STORE_CALIFICA_CONDUCTOR_DESPACHO =
    "UPDATE " + _STORE_ + ".`despacho` SET `sinLeerConductor` = 0, `calificarConductor` = 2, `calificacionConductor` = ?, `comentarioConductor` = ?, `fecha_califico_conductor` = NOW() WHERE `id_despacho` = ? LIMIT 1;";


function calificar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var calificacion = 0;
    var comentario = '';
    var tipo = req.body.tipo;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;

    var SQL_ = '';
    if (tipo == _TIPO_CLIENTE) {
        SQL_ = STORE_CALIFICA_CLIENTE_DESPACHO;
        calificacion = req.body.calificacionCliente;
        comentario = req.body.comentarioCliente;

    } else if (tipo == _TIPO_CONDUCTOR) {
        SQL_ = STORE_CALIFICA_CONDUCTOR_DESPACHO;
        calificacion = req.body.calificacionConductor;
        comentario = req.body.comentarioConductor;
    }

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(SQL_, [calificacion, comentario, idDespacho], function () {
            data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
                return res.status(200).send({ estado: 1, error: 'Gracias por tu comentario.', despacho: despachos[0] });
            }, res);
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

const STORE_CANCELAR_COMPRA =
    "UPDATE " + _STORE_ + ".`compra` SET id_cancelo = ?, `calificarCajero` = 1, `calificarCliente` = 1, `id_compra_estado` = ?, `fecha_cancelo` = NOW() WHERE `id_compra` = ? LIMIT 1;";

function cancelar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idClienteRecibe = req.body.idClienteRecibe;
    var idClienteEnvia = req.body.idClienteEnvia;
    var idCompra = req.body.idCompra;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let idCompraEstado = _COMPRA_CANCELADA;
        data.consultarRes(STORE_CANCELAR_COMPRA, [idCliente, idCompraEstado, idCompra], function () {
            data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
                let mensaje = '🚫 Compra cancelada';
                let valor = '';
                chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_LINE, '🚫 Compra cancelada', mensaje, valor, idCompraEstado, function () {
                    let mensaje = '😔 Tu compra se ha cancelado, 🙏 por favor califica tu experiencia';
                    let valor = '';
                    chatCompra.enviarChat(req, imei, idCompra, idClienteRecibe, idClienteEnvia, _CHAT_ENVIA_CAJERO, _CHAT_TIPO_TEXTO, '🚫 Compra cancelada', mensaje, valor, idCompraEstado, function () {

                        _despacho.cancelar(req, imei, idDespacho, idClienteEnvia, idClienteRecibe, function (respuesta) {
                            return res.status(200).send({ estado: 1, despacho: despachos[0] });
                        }, res);

                    }, res);
                }, res);
            }, res);
        }, res);
    });
}


router.post('/reversar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return reversar(req, res, idplataforma, imei);
});

const STORE_REVERSAR =
    "UPDATE " + _STORE_ + ".`despacho` SET id_despacho_estado = ?, `fecha_reverso` = NOW() WHERE `id_despacho` = ? AND fecha_reverso IS NULL LIMIT 1;";

function reversar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idDespacho = req.body.idDespacho;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        let idDespachoEstado = _DESPACHO_RECOGIDO;
        data.consultarRes(STORE_REVERSAR, [idDespachoEstado, idDespacho], function () {

            data.consultarRes(STORE_LISTAR_ID_DESPACHO_CLIENTE, [idDespacho], function (despachos) {
                return res.status(200).send({ estado: 1, despacho: despachos[0] });
            }, res);

        }, res);

    });
}

module.exports = router;