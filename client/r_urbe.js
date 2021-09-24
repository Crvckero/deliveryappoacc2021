var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

router.post('/localizar/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return localizar(req, res, idplataforma, imei);
});

function localizar(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        var lt = req.body.lt;
        var lg = req.body.lg;
        var SQL_LOCALIZAR =
            "SELECT u.id_urbe, u.urbe "
            + "FROM " + _STORE_ + ".urbe u "
            + "WHERE u.id_urbe = 1 LIMIT 1;";
        // + "WHERE u.activo = 1 AND st_Within(ST_GEOMFROMTEXT('POINT(" + lt + " " + lg + ")'), ST_GEOMFROMTEXT(ST_AsWKT(frontera))) = 1 LIMIT 1;";
        data.consultarRes(SQL_LOCALIZAR, [], function (urbes) {
            if (urbes.length <= 0)
                return res.status(200).send({ estado: 0, error: 'Lo sentimos no laboramos en esa zona' });
            return res.status(200).send({ estado: 1, urbe: urbes[0] });
        }, res);
    });
}


module.exports = router;