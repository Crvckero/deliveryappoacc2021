var router = require('express').Router();
var data = require('./data.js');

router.post('/', function (req, res) {
    res.status(200).send({});
    return rastreo(req, res);
});

function rastreo(req, res) {
    var idCliente = req.body.idCliente;
    var lt = req.body.lt;
    var lg = req.body.lg;
    var imei = req.headers.imei;

    data.consultar(STORE_LOCATION, [idCliente, imei, JSON.stringify({ lt: lt, lg: lg })]);
    data.consultar(STORE_UPDATE, [lt, lg, idCliente, imei]);

    data.consultarCallback(STORE_NOTIFICAR, [idCliente], function (sokects) {
        if (sokects['error'] || sokects.length <= 0)
            return;
        for (let index = 0; index < sokects.length; index++)
            EMIT_.to(sokects[index]['id']).emit('l', { t: 1, l: { lt: lt, lg: lg } });
    });
}


const STORE_LOCATION =
    "INSERT INTO " + _STORE_ + "_track.register (fecha, id_cliente, imei, p, hora) VALUES (CURDATE(), ?, ?, ?, CURTIME());";

const STORE_UPDATE =
    "UPDATE " + _STORE_ + ".`cliente_session` SET `lt` = ?, `lg` = ?, utc = NOW() WHERE (`id_cliente` = ?) AND (`imei` = ?) LIMIT 1;";

const STORE_NOTIFICAR =
    "SELECT id FROM " + _STORE_ + ".cliente_session cs WHERE id_rastreo = ? AND on_line = 1 LIMIT 100;";

module.exports = router;