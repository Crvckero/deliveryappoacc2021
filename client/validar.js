const data = require('./data.js');

module.exports = {
    token: token
};

const STORE_VALIDAR =
    "SELECT c.id_urbe, c.nombres, c.apellidos, c.celular, c.correo, cs.rastrear, c.cio, c.correctos, c.perfil "
    + " FROM " + _STORE_ + ".cliente_session cs "
    + " INNER JOIN " + _STORE_ + ".cliente c ON cs.id_cliente = c.id_cliente "
    + " WHERE cs.id_cliente = ? AND c.bloqueado = 0 AND  cs.id_plataforma = ? AND cs.imei = ? AND cs.auth = MD5(CONCAT('" + _SEMILLA + "', ?)) AND cs.activado = 1 LIMIT 1;";

function token(idCliente, auth, idPlataforma, imei, res, callback) {
    data.consultarRes(STORE_VALIDAR, [idCliente, idPlataforma, imei, auth], function (clientes) {
        if (clientes.length > 0)
            return callback(true, clientes[0]);
        res.status(403).send({ error: 'Lo lamento usted no esta autorizado' });
        return callback(false);
    }, res);
}