const expressip = require('express-ip');
const express = require('express');
const cookieParser = require('cookie-parser');
const data = require('./data.js');

require('./GLOB');

const app = express();


app.use(expressip().getIpInfoMiddleware);
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: "12mb" }));
app.use(bodyParser.urlencoded({ limit: "12mb", extended: true, parameterLimit: 100 }));
app.use(cookieParser('XOMqKyA7xOLrF3AkJpfQcnHwwZRGw'));

var PORT = 8080;

global._ENVIRONMENT_ = 'developing'//'production';
global._IS_DEV_ = false;
global._SERVER = 'http://167.99.60.223/';

if (process.argv.length >= 3) {
    if (process.argv[2] === 'developing') {
        _ENVIRONMENT_ = 'developing';
        _IS_DEV_ = true;
        _SERVER = 'http://167.99.60.223/';
        PORT = 39123;
    }
}

app.use(require('./r_acceso'));
app.get('/', function (req, res) {
    res.status(200).send({ status: true, environment: _ENVIRONMENT_ });
});
app.enable('trust proxy');
app.disable('x-powered-by');
const http = require('http').Server(app);
http.listen(PORT, function () {
    console.log('Servidor ON puerto: ', PORT, ' ENVIRONMENT: ', _ENVIRONMENT_);
});

app.use(express.static(__dirname + '/publica'));
app.use(express.static(__dirname + '/web'));

app.use('/registro', require('./client/r_registro'));
app.use('/agencia', require('./client/r_agencia'));
app.use('/cajero', require('./client/r_cajero'));
app.use('/card', require('./client/r_card'));
app.use('/catalogo', require('./client/r_catalogo'));
app.use('/categoria', require('./client/r_categoria'));
app.use('/chat-compra', require('./client/r_chat_compra'));
app.use('/chat-despacho', require('./client/r_chat_despacho'));
app.use('/cliente', require('./client/r_cliente'));
app.use('/compra', require('./client/r_compra'));
app.use('/contacto', require('./client/r_contacto'));
app.use('/despacho', require('./client/r_despacho'));
app.use('/direccion', require('./client/r_direccion'));
app.use('/factura', require('./client/r_factura'));
app.use('/hashtag', require('./client/r_hashtag'));
app.use('/mapa', require('./client/r_mapa'));
app.use('/notificacion', require('./client/r_notificacion'));
app.use('/promocion', require('./client/r_promocion'));
app.use('/r', require('./client/r_rastreo'));
app.use('/saldo', require('./client/r_saldo'));
app.use('/urbe', require('./client/r_urbe'));

app.use('/g/agencia', require('./admin/r_agencia'));
app.use('/g/promocion', require('./admin/r_promocion'));
app.use('/g/reporte', require('./admin/r_reporte'));
app.use('/g/sucursal-cajero', require('./admin/r_sucursal_cajero'));
app.use('/g/sucursal-horario', require('./admin/r_sucursal_horario'));
app.use('/g/sucursal', require('./admin/r_sucursal'));
app.use('/g/urbe', require('./admin/r_urbe'));
app.use('/g/ventas', require('./admin/r_ventas'));

const STORE_LIMPIAR =
    "UPDATE `" + _STORE_ + "`.`cliente_session` SET `on_line` = '0';";

const STORE_ON_OFF =
    "UPDATE `" + _STORE_ + "`.`cliente_session` SET `on_line` = ?, id = ? WHERE `id_cliente` = ? AND `imei` = ? LIMIT 1;";

global.EMIT_;

data.consultarCallback(STORE_LIMPIAR, [], function () {
    EMIT_ = require('socket.io')(http).on('connection', function (socket) {
        if (!socket.handshake.query.idcliente || !socket.handshake.query.imei)
            return socket.disconnect();
        else
            data.consultar(STORE_ON_OFF, [1, socket.id, socket.handshake.query.idcliente, socket.handshake.query.imei]);
        socket.on('disconnect', function () {
            if (socket.handshake.query.idcliente && socket.handshake.query.imei)
                data.consultar(STORE_ON_OFF, [0, socket.id, socket.handshake.query.idcliente, socket.handshake.query.imei]);
        });
    });
});
