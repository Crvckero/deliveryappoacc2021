var router = require('express').Router();
var data = require('./data.js');
var validar = require('./validar');

router.post('/ver', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return ver(req, res, marca, modelo, so, vs, idplataforma, imei);
});

const STORE_VERIFICAR_CHAS =
    "SELECT id_cliente FROM " + _STORE_ + ".saldo s WHERE s.id_cliente = ? AND s.cash > 0 LIMIT 1;";

function ver(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var hashtag = req.body.hashtag;
    var pr = JSON.parse(req.body.cajeros);
    let url = 'https://www.facebook.com/opportunity.planck';
    let error = 'Hashtag incorrecto. Deseas continuar con la compra?';
    let estado = -1;
    let mBotonDerecha = 'SEGUIR';
    let mIzquierda = 'DECLINAR';
    if (pr.length <= 0)
        return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda });
    if (!hashtag)
        return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda });

    hashtag = hashtag.replace('#', '');

    var ids = `${pr[0]['id_agencia']}`;
    var id_agencia = pr[0]['id_agencia'];
    for (var i = 1; i < pr.length; i++) {
        ids += `,${pr[i]['id_agencia']}`;
    }

    validar.token(idCliente, auth, idplataforma, imei, res, function (autorizado, cliente) {
        if (!autorizado)
            return;
        data.consultarRes(STORE_VERIFICAR_CHAS, [idCliente], function (chas) {
            //Si el cliente tiene cash no se da descuento por hastag genera conflicto si se quita
            if (chas.length > 0)
                return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda });
            var STORE_CODIGO =
                `SELECT caduco, monto, IF(id_agencia = -1, ?, IF(id_agencia IN (${ids}), id_agencia, (id_agencia * -1) )) AS id_agencia, id_hashtag, promocion, mBotonDerechaError, mBotonDerechaCaduco, mIzquierda, error, url FROM ` + _STORE_ + `.hashtag c WHERE c.hashtag = ? AND activo = 1 LIMIT 1;`;
            data.consultarRes(STORE_CODIGO, [id_agencia, hashtag], function (hashtags) {
                if (hashtags.length <= 0)
                    return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda });
                url = hashtags[0]['url'];
                mBotonDerecha = hashtags[0]['mBotonDerechaCaduco'];
                mIzquierda = hashtags[0]['mIzquierda'];
                error = hashtags[0]['caduco'];
                let monto = hashtags[0]['monto'];
                if (monto <= 0.25) {
                    return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda });
                }
                mBotonDerecha = hashtags[0]['mBotonDerechaError'];
                let promocion = hashtags[0]['promocion'];//Se cubre solo el valor de la promocion;//Porcentaje de promocion
                error = hashtags[0]['error'];
                id_agencia = hashtags[0]['id_agencia'];
                let id_hashtag = hashtags[0]['id_hashtag'];
                //Cuando el hashtag es correcto pero pertenece a otra agencia.
                if (hashtags[0]['id_agencia'] < 0) {
                    estado = 2;
                    id_agencia = (hashtags[0]['id_agencia'] * -1);
                    return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda, promocion: promocion, id_agencia: id_agencia, id_hashtag: id_hashtag });
                }
                var costoEnvio = 0.0;
                for (var i = 0; i < pr.length; i++) {
                    if (pr[i]['id_agencia'] == id_agencia) {
                        costoEnvio = pr[i]['costo_envio']
                        break;
                    }
                }
                var valorAdesontar = 0.0;
                if (promocion > 0) {
                    valorAdesontar = promocion * costoEnvio / 100;
                }
                data.consultar(STORE_REGISTRAR_HT, [idCliente, id_hashtag, imei, promocion, valorAdesontar, costoEnvio]);
                estado = 1;
                return res.status(200).send({ estado: estado, url: url, error: error, mBotonDerecha: mBotonDerecha, mIzquierda: mIzquierda, promocion: valorAdesontar, id_agencia: id_agencia, id_hashtag: id_hashtag });
            }, res);
        }, res);
    });
}

const STORE_REGISTRAR_HT =
    "INSERT INTO " + _STORE_ + "_register.cliente_hashtag (id_cliente, id_hashtag, imei, promocion, transaccion, costo_envio) VALUES (?, ?, ?, ?, ?, ?);";

module.exports = router;