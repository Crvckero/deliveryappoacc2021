var feedback = require('./feedback.js');
var data = require('./data.js');

module.exports = {
    regitrar: regitrar
};

function regitrar(idaplicativo, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, idplataforma, codigoPais, simCountryCode, smn, imei, token, marca, modelo, so, vs, img, req, res) {
    var idApple = req.body.idApple;
    var idFacebook = req.body.idFacebook;
    var idGoogle = req.body.idGoogle;

    if (!idApple)
        idApple = null;
    if (!idFacebook)
        idFacebook = null;
    if (!idGoogle)
        idGoogle = null;
    if (correo === 'null')
        correo = null;
    if (celular === 'null')
        celular = null;
    var meta = JSON.stringify({ 'headers': req.headers, 'ipInfo': req.ipInfo });
    data.consultarRes(STORE_LIMPIAR_TOKEN, [token], function () {
        data.consultarRes(STORE_REGISTRAR, [idaplicativo, idFacebook, idGoogle, idApple, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, idplataforma, codigoPais, simCountryCode, smn, img, meta], function (registro) {
            if (registro['insertId'] <= 0)
                return res.status(200).send({ estado: -1, error: 'Ocurrio un probelam y no pudimos registrarte, intenta de nuevo mas tarde.' });
            let idCliente = registro['insertId'];
            data.consultarRes(STORE_AUTENTICAR, [idCliente], function (clientes) {
                if (clientes.length <= 0)
                    return res.status(200).send({ estado: -1, error: 'Ocurrio un probelam y no pudimos registrarte, intenta de nuevo mas tarde.' });
                let cliente = clientes[0];
                var auth = randonToken();
                data.consultarRes(STORE_REGISTRAR_SESSION, [idaplicativo, meta, cliente['id_cliente'], idplataforma, imei, auth, token, marca, modelo, so, vs, auth, token, marca, modelo, so, vs, meta], function (session) {
                    if (session['affectedRows'] <= 0)
                        return res.status(200).send({ estado: -1, error: 'Ocurrio un probelam y no pudimos registrarte, intenta de nuevo mas tarde.' });
                    feedback.notificarBienbenida(idaplicativo, idCliente, nombres, correo, clave);
                    return res.status(200).send({ estado: 1, auth: auth, idCliente: cliente['id_cliente'], cliente: cliente });
                }, res);
            }, res);
        }, res);
    }, res);
}

const STORE_REGISTRAR =
    "INSERT INTO " + _STORE_ + ".cliente (id_aplicativo, idFacebook, idGoogle, idApple, celular, correo, clave, nombres, apellidos, cedula, celularValidado, correoValidado, fecha_registro, url, id_plataforma, codigoPais, simCountryCode, smn, img, meta) VALUES (?, ?, ?, ?, ?, ?, MD5(CONCAT('" + _SEMILLA + "', MD5(?))), ?, ?, ?, ?, ?, NOW(), MD5(NOW()), ?, ?, ?, ?, ?, ?);";

const STORE_AUTENTICAR =
    "SELECT u.id_cliente, u.id_urbe, u.activo, link, sexo, id_cliente, celular, correo, nombres, apellidos, cedula, cambiarClave, IF(celularValidado = 0, 0, 1) AS celularValidado, IF(correoValidado = 0, 0, 1) AS correoValidado, img, perfil, calificacion, calificaciones, registros, puntos, direcciones, correctos, canceladas, IFNULL(DATE_FORMAT(fecha_nacimiento,'%Y-%m-%d'), '') AS fecha_nacimiento FROM " + _STORE_ + ".cliente u WHERE u.id_cliente = ? LIMIT 1;";

const STORE_REGISTRAR_SESSION =
    "INSERT INTO " + _STORE_ + ".cliente_session (id_aplicativo, meta, id_cliente, id_plataforma, imei, auth, token, marca, modelo, so, vs, fecha_inicio) "
    + " VALUES (?, ?, ?, ?, ?, MD5(CONCAT('" + _SEMILLA + "', ?)), ?, ?, ?, ?, ?, NOW()) "
    + " ON DUPLICATE KEY UPDATE auth = MD5(CONCAT('" + _SEMILLA + "', ?)), token= ?, marca= ?, modelo= ?, so= ?, vs= ?, activado=b'1', meta=?, on_line = 1;";

const STORE_LIMPIAR_TOKEN =
    "UPDATE " + _STORE_ + ".`cliente_session` SET `token` = NULL WHERE `token` = ? LIMIT 1;";

function randonToken() {
    var token = '';
    var leter = ['@', '&', '/', 'A', 'B', 'C', 'D', 'E', 'O', '@', '--', '/', 'P', 'F', 'G', 'H', '@', '&', '-*', 'I', 'J', 'K', 'L', 'M', 'N', 'O', '@', '--', '/', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'O'];
    for (var i = 0; i < 80; i++)
        token += leter[Math.floor(Math.random() * leter.length)];
    return (token);
}