var router = require('express').Router();
var data = require('./data.js');

router.post('/listar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return listar(req, res, idplataforma, imei);
});

function listar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idUrbe = req.body.idUrbe;
    var idaplicativo = req.headers.idaplicativo;
    data.consultarRes(STORE_LISTAR, [idaplicativo, idUrbe], function (categorias) {
        return res.status(200).send({ estado: 1, categorias: categorias });
    }, res);
}

const STORE_LISTAR =
    "SELECT uc.id_categoria, uc.nombre, uc.label, uc.estado, c.img "
    + " FROM " + _STORE_ + ".urbe_categoria uc "
    + " INNER JOIN " + _STORE_ + ".categoria c ON uc.id_categoria = c.id_categoria "
    + " WHERE uc.id_aplicativo = ? AND uc.id_urbe = ? AND uc.estado = 1 ORDER BY orden ASC;";

module.exports = router;