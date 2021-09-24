var router = require('express').Router();
var data = require('./data.js');

router.post('/link', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return link(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function link(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var link = req.body.link;
    var idPromocion = req.body.idPromocion;
    data.consultarRes(STORE_LINK, [link, idPromocion], function () {
        return res.status(200).send({ estado: 1 });
    }, res);
}

var STORE_LINK =
    "UPDATE " + _STORE_ + ".`promocion` SET `link` = ? WHERE `id_promocion` = ? LIMIT 1;";


router.post('/share', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return share(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function share(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var idPromocion = req.body.idPromocion;
    var share = req.body.share;
    if (share == 1) {
        data.consultar(STORE_SHARE, [idPromocion, idCliente]);
    } else {
        var like = req.body.like;
        data.consultar(STORE_LIKE, [idPromocion, idCliente, like, like]);
    }
    return res.status(200).send({ estado: 1 });
}

var STORE_LIKE =
    "INSERT INTO " + _STORE_ + "_data.`promocion_share` (`id_promocion`, `id_cliente`, `like`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `like` = ?;";

var STORE_SHARE =
    "INSERT INTO " + _STORE_ + "_data.`promocion_share` (`id_promocion`, `id_cliente`, `shares`) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE shares = shares + 1;";

router.post('/listar', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;

    return listar(req, res, idplataforma, imei);
});

function listar(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idUrbe = req.body.idUrbe;
    var pagina = req.body.pagina;
    var idaplicativo = req.headers.idaplicativo;

    var criterio = req.body.criterio;
    if (!criterio)
        criterio = '';

    var categoria = req.body.categoria;
    if (!categoria)
        categoria = 0;

    if (criterio.length <= 2) {
        var isPromocion = 1;
        if (categoria == 0) //Muestra todo indiferente de la categoria
        {
            return data.consultarRes(`${STORE_LISTAR_}${_DESTACADOS}`, [idaplicativo, idUrbe, isPromocion], function (promociones) {

                isPromocion = 0;
                return data.consultarRes(`${STORE_LISTAR_}${_DESTACADOS}`, [idaplicativo, idUrbe, isPromocion], function (productos) {
                    return res.status(200).send({ estado: 1, promociones: promociones.concat(productos) });
                }, res);

            }, res);
        } else //Lista todas las agencias filtadas por categoria, Recomendadas || Populares y Principales
        {
            return data.consultarRes(`${STORE_LISTAR_}${_CATEGORIA}`, [categoria, idaplicativo, idUrbe, isPromocion], function (promociones) {

                isPromocion = 0;
                return data.consultarRes(`${STORE_LISTAR_}${_CATEGORIA}`, [categoria, idaplicativo, idUrbe, isPromocion], function (productos) {
                    return res.status(200).send({ estado: 1, promociones: promociones.concat(productos) });
                }, res);
            }, res);
        }
    } else //Lista todas las prociones por criterio indiferente de la categoria
    {
        if (criterio.length > 60) criterio = criterio.substring(0, 60); 
        return data.consultarRes(`${STORE_LISTAR_}${_CRITERIO}`, [idaplicativo, idUrbe, criterio, criterio], function (promociones) {
            return res.status(200).send({ estado: 1, promociones: promociones });
        }, res);
    }

}

const STORE_CRITERIO_PROMO =
    "SELECT DISTINCT(p.id_promocion) FROM " + _STORE_ + ".agencia a INNER JOIN " + _STORE_ + ".promocion p ON a.id_agencia = p.id_agencia WHERE MATCH (a.criterio) AGAINST (?) OR MATCH (p.criterio) AGAINST (?)"

const _CRITERIO =
    ` WHERE ap.id_aplicativo = ? AND p.id_urbe = ? AND p.tipo = 1 AND p.aprobado = 1 AND p.id_promocion IN (${STORE_CRITERIO_PROMO}) GROUP BY p.id_promocion ORDER BY estado DESC LIMIT 50;`;

const _CATEGORIA =
    " INNER JOIN " + _STORE_ + ".agencia_categoria ac ON ac.id_agencia = p.id_agencia AND ac.id_categoria = ? AND ac.activo = 1 "
    + ` WHERE ap.id_aplicativo = ? AND p.id_urbe = ? AND p.promocion = ? AND p.visible = 1 AND p.activo = 1 AND p.aprobado = 1 AND p.precio > 1.5 AND p.tipo = 1 GROUP BY p.id_promocion ORDER BY estado DESC, IF((DAY(NOW()) % p.ventas) = 1, 0, 1), p.ventas DESC LIMIT 50;`;

const _DESTACADOS =
    ` WHERE ap.id_aplicativo = ? AND p.id_urbe = ? AND p.promocion = ? AND p.visible = 1 AND p.activo = 1 AND p.aprobado = 1 AND p.precio > 1.5 AND p.tipo = 1 GROUP BY p.id_promocion ORDER BY estado DESC, IF((DAY(NOW()) % p.ventas) = 1, 0, 1), p.ventas DESC LIMIT 50;`;

const STORE_LISTAR_ =
    "SELECT p.id_registro, IF(ANY_VALUE(sh.id_sucursal) IS NULL, 0, p.activo) AS estado, IF(p.activo = 1, 'Local cerrado', 'Agotado') AS mensaje, IF(p.promocion > 0, 1, 0) AS promocion, p.productos, p.activo, p.tipo, p.id_urbe, p.inventario, p.id_promocion, p.id_agencia, incentivo, producto, descripcion, precio, imagen, minimo, maximo  "
    + " FROM " + _STORE_ + ".promocion p "
    + " INNER JOIN " + _STORE_ + ".agencia a ON a.id_agencia = p.id_agencia AND a.activo = 1"
    + " INNER JOIN " + _STORE_ + ".agencia_aplicativo ap ON ap.id_agencia = p.id_agencia AND ap.activo = 1 "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON s.id_agencia = p.id_agencia AND s.activo = 1"
    + " LEFT JOIN " + _STORE_ + ".sucursal_horario sh ON sh.id_sucursal = s.id_sucursal AND sh.activo = 1 AND DATE_FORMAT(CONVERT_TZ(NOW(),'UTC', sh.TZ),'%w') = sh.dia AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) >= sh.desde AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) <= sh.hasta ";


module.exports = router;