var router = require('express').Router();
var data = require('./data.js');

router.post('/referido', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return referido(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function referido(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var idAgencia = req.body.idAgencia;
    var idP = req.body.idP;
    if (!idP)
        idP = '0';
    if (idP != '0') {
        data.consultar(STORE_REGISTRAR_REFERIDO_PROMO, [idP, idCliente]);
    } else {
        data.consultar(STORE_REGISTRAR_REFERIDO_AGENCIA, [idAgencia, idCliente]);
    }
    return res.status(200).send({ estado: 1 });
}

const STORE_REGISTRAR_REFERIDO_PROMO =
    "INSERT INTO `" + _STORE_ + "_data`.`referido_promocion` (`id_promocion`, `id_cliente`) VALUES (?, ?) ON DUPLICATE KEY UPDATE referidos = referidos + 1;"

const STORE_REGISTRAR_REFERIDO_AGENCIA =
    "INSERT INTO `" + _STORE_ + "_data`.`referido_agencia` (`id_agencia`, `id_cliente`) VALUES (?, ?) ON DUPLICATE KEY UPDATE referidos = referidos + 1;"

router.post('/like', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    var marca = req.headers.marca;
    var modelo = req.headers.modelo;
    var so = req.headers.so;
    var vs = req.headers.vs;
    return like(req, res, marca, modelo, so, vs, idplataforma, imei);
});

function like(req, res, marca, modelo, so, vs, idplataforma, imei) {
    var auth = req.body.auth;
    var idCliente = req.body.idCliente;
    var like = req.body.like;
    var share = req.body.share;
    var idAgencia = req.body.idAgencia;

    var idP = req.body.idP;
    if (!idP)
        idP = '0';

    if (idP != '0') {
        data.consultar(STORE_REGISTRAR_SHARE_PROMO, [idCliente, idP]);
        data.consultar(STORE_SHARES_PROMO, [idP]);
        return res.status(200).send({ estado: 1 });
    }

    if (!share)
        share = 0;

    if (share == 1) {
        data.consultar(STORE_REGISTRAR_SHARE_AGENCIA, [idCliente, idAgencia, idCliente, idCliente]);
        data.consultar(STORE_SHARES_AGENCIA, [idAgencia]);
        return res.status(200).send({ estado: 1 });
    }

    if (like == 1) {
        data.consultar(STORE_LIKES_LIKE, [idCliente, idAgencia, idCliente, idCliente]);
        return res.status(200).send({ estado: 1 });
    }
    else if (like == 0) {
        data.consultar(STORE_LIKES_DISLIKE, [idCliente, idAgencia]);
        return res.status(200).send({ estado: 1 });
    } else return res.status(200).send({ estado: 1 });
}

const STORE_SHARES_PROMO =
    "UPDATE " + _STORE_ + ".`promocion` SET `shares` = shares + '1' WHERE (`id_promocion` = ?) LIMIT 1;";

const STORE_REGISTRAR_SHARE_PROMO =
    "INSERT INTO `" + _STORE_ + "_data`.`promocion_share` (`id_cliente`, `id_promocion`) VALUES (?, ?) ON DUPLICATE KEY UPDATE shares = shares + 1;";


const STORE_SHARES_AGENCIA =
    "UPDATE " + _STORE_ + ".`agencia` SET `shares` = shares + '1' WHERE (`id_agencia` = ?) LIMIT 1;";

const STORE_REGISTRAR_SHARE_AGENCIA =
    "INSERT INTO " + _STORE_ + ".`cliente_agencia` "
    + " (`id_cliente`, `id_agencia`, `me_gusta`, `shares`, `id_registro`) "
    + " VALUES  (?, ?, 0, 1, ?) ON DUPLICATE KEY UPDATE shares = shares + 1, id_actualizo = ?;";

var STORE_LIKES_LIKE =
    "INSERT INTO " + _STORE_ + ".`cliente_agencia` "
    + " (`id_cliente`, `id_agencia`, `id_registro`) "
    + " VALUES "
    + " (?, ?, ?) ON DUPLICATE KEY UPDATE me_gusta = 1, id_actualizo = ?;";

var STORE_LIKES_DISLIKE =
    "UPDATE " + _STORE_ + ".`cliente_agencia` SET `me_gusta` = '0' WHERE (`id_cliente` = ?) AND (`id_agencia` = ?);";

router.post('/ver/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    return ver(req, res, idplataforma, imei);
});

const STORE_VER_CATALOGO =
    "SELECT IFNULL(ca.me_gusta, 0) AS `like`, a.tipo, MIN(IF(sh.id_sucursal IS NOT NULL, '1', s.observacion)) AS abiero, ANY_VALUE(a.id_agencia) AS id_agencia, ANY_VALUE(a.agencia) AS agencia, ANY_VALUE(a.direccion) AS direccion, ANY_VALUE(a.observacion) AS observacion, ANY_VALUE(a.contacto) AS contacto, ANY_VALUE(a.img) AS img "
    + " FROM " + _STORE_ + ".agencia a "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON a.id_agencia = s.id_agencia AND s.activo = 1 "
    + " INNER JOIN " + _STORE_ + ".agencia_aplicativo ap ON ap.id_agencia = s.id_agencia AND ap.id_aplicativo = ? AND ap.activo = 1 "
    + " LEFT JOIN " + _STORE_ + ".cliente_agencia ca ON ca.id_cliente = ? AND ca.id_agencia = a.id_agencia"

    + " LEFT JOIN " + _STORE_ + ".sucursal_horario sh ON sh.id_sucursal = s.id_sucursal AND sh.activo = 1 AND DATE_FORMAT(CONVERT_TZ(NOW(),'UTC', sh.TZ),'%w') = sh.dia AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) >= sh.desde AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) <= sh.hasta"
    + " WHERE a.id_agencia = ? GROUP BY a.id_agencia ORDER BY MIN(IF(sh.id_sucursal IS NOT NULL, a.orden, 9999999)) ASC;";

function ver(req, res, idplataforma, imei) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idCatalogo = req.body.idCatalogo;
    var idaplicativo = req.headers.idaplicativo;

    data.consultarRes(STORE_VER_CATALOGO, [idaplicativo, idCliente, idCatalogo], function (catalogos) {
        if (catalogos.length <= 0)
            return res.status(200).send({ estado: -1, error: 'Fuera de horario' });
        return res.status(200).send({ estado: 1, catalogo: catalogos[0] });
    }, res);
}

router.post('/listar-agencias/', function (req, res) {
    var referencia = req.headers.referencia;
    if (referencia !== '12.03.91')
        return res.status(320).send({ error: 'Deprecate' });
    var idplataforma = req.headers.idplataforma;
    var imei = req.headers.imei;
    let versiones = '';
    try {
        versiones = req.headers['vs'].split('.');
    } catch (exception) {
        return res.status(403).send({});
    }
    if (versiones.length != 3) return res.status(403).send({});
    var version = versiones[2];
    return listarAgencias(req, res, idplataforma, imei, version);
});


function listarAgencias(req, res, idplataforma, imei, version) {
    var idCliente = req.body.idCliente;
    var auth = req.body.auth;
    var idUrbe = req.body.idUrbe;
    var idaplicativo = req.headers.idaplicativo;

    var criterio = req.body.criterio;
    if (!criterio)
        criterio = '';

    var categoria = req.body.categoria;
    if (!categoria)
        categoria = 0;

    var selectedIndex = req.body.selectedIndex;
    if (!selectedIndex)
        selectedIndex = 0;


    if (selectedIndex == 3)//Favoritos
    {
        if (categoria == 0)//Listar todo sin distingir categoria
        {
            return data.consultarRes(`${_S_FAVORITO}${STORE_LISTAR_AGENCIAS}${_FAVORITOS}`, [idaplicativo, idCliente, idUrbe, version], function (catalogos) {
                return res.status(200).send({ estado: 1, catalogos: catalogos });
            }, res);
        } else //Distingue la categoria
        {
            return data.consultarRes(`${_S_FAVORITO}${STORE_LISTAR_AGENCIAS}${_CATEGORIA}${_FAVORITOS}`, [idaplicativo, categoria, idCliente, idUrbe, version], function (catalogos) {
                return res.status(200).send({ estado: 1, catalogos: catalogos });
            }, res);
        }
    }

    var recomendado = -1;
    if (selectedIndex == 4)//Recomendados
        recomendado = 1;

    if (categoria == 0) //Muestra todo indiferente de la categoria
    {
        if (criterio.length <= 2) {
            return data.consultarRes(`${_S_NORMAL}${STORE_LISTAR_AGENCIAS}${recomendado == 1 ? _RECOMENDADAS : _POPULARES}`, [idaplicativo, idUrbe, version], function (catalogos) {
                return res.status(200).send({ estado: 1, catalogos: catalogos });
            }, res);
        }
        else //Muestra todo sin considerar el criterio de busqueda
        {
            return data.consultarRes(`${_S_NORMAL}${STORE_LISTAR_AGENCIAS}${_CRITERIO}`, [idaplicativo, idUrbe, version, criterio, criterio], function (catalogos) {
                return res.status(200).send({ estado: 1, catalogos: catalogos });
            }, res);
        }
    } else //Lista todas las agencias filtadas por categoria, Recomendadas || Populares y Principales
    {
        return data.consultarRes(`${_S_NORMAL}${STORE_LISTAR_AGENCIAS}${_CATEGORIA}${recomendado == 1 ? _RECOMENDADAS : _POPULARES}`, [idaplicativo, categoria, idUrbe, version], function (catalogos) {
            return res.status(200).send({ estado: 1, catalogos: catalogos });
        }, res);
    }
}

const _S_NORMAL =
    "SELECT a.label, a.tipo, MIN(IF(sh.id_sucursal IS NOT NULL, '1', s.observacion)) AS abiero, ANY_VALUE(a.id_agencia) AS id_agencia, ANY_VALUE(a.agencia) AS agencia, ANY_VALUE(a.direccion) AS direccion, ANY_VALUE(a.observacion) AS observacion, ANY_VALUE(a.contacto) AS contacto, ANY_VALUE(a.img) AS img ";

const _S_FAVORITO =
    "SELECT IFNULL(ca.me_gusta, 0) AS `like`, a.label, a.tipo, MIN(IF(sh.id_sucursal IS NOT NULL, '1', s.observacion)) AS abiero, ANY_VALUE(a.id_agencia) AS id_agencia, ANY_VALUE(a.agencia) AS agencia, ANY_VALUE(a.direccion) AS direccion, ANY_VALUE(a.observacion) AS observacion, ANY_VALUE(a.contacto) AS contacto, ANY_VALUE(a.img) AS img ";

const STORE_LISTAR_AGENCIAS =
    " FROM " + _STORE_ + ".agencia a "
    + " INNER JOIN " + _STORE_ + ".sucursal s ON a.id_agencia = s.id_agencia AND s.activo = 1 "
    + " INNER JOIN " + _STORE_ + ".agencia_aplicativo ap ON ap.id_agencia = s.id_agencia AND ap.id_aplicativo = ? AND ap.activo = 1 "
    + " LEFT JOIN " + _STORE_ + ".sucursal_horario sh ON sh.id_sucursal = s.id_sucursal AND sh.activo = 1 AND DATE_FORMAT(CONVERT_TZ(NOW(),'UTC', sh.TZ),'%w') = sh.dia AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) >= sh.desde AND TIME(CONVERT_TZ(NOW(),'UTC', sh.TZ)) <= sh.hasta";

const _CATEGORIA =
    " INNER JOIN " + _STORE_ + ".agencia_categoria ac ON ac.id_agencia = a.id_agencia AND ac.id_categoria = ? AND ac.activo = 1 ";

const _POPULARES =
    " WHERE a.activo = 1 AND s.id_urbe = ? AND (s.tipo = 2 OR s.tipo = 3 OR s.tipo = 4) AND ? >= a.vs GROUP BY a.id_agencia ORDER BY MIN(IF(sh.id_sucursal IS NOT NULL, a.orden, 999999)) ASC;";

const _RECOMENDADAS =
    " WHERE a.activo = 1 AND s.id_urbe = ? AND a.recomendado >= 1 AND (s.tipo = 2 OR s.tipo = 3 OR s.tipo = 4) AND ? >= a.vs GROUP BY a.id_agencia HAVING abiero = '1' ORDER BY MIN(IF(sh.id_sucursal IS NOT NULL, a.recomendado, 999999)) ASC;";

const _FAVORITOS =
    " INNER JOIN " + _STORE_ + ".cliente_agencia ca ON ca.id_agencia = a.id_agencia AND ca.me_gusta = 1"
    + " WHERE a.activo = 1 AND ca.id_cliente = ? AND s.id_urbe = ? AND (s.tipo = 2 OR s.tipo = 3 OR s.tipo = 4) AND ? >= a.vs GROUP BY a.id_agencia ORDER BY MIN(IF(sh.id_sucursal IS NOT NULL, a.orden, 999999)) ASC;";

const STORE_CRITERIO_AGENCIA =
    "SELECT DISTINCT(a.id_agencia) FROM " + _STORE_ + ".agencia a INNER JOIN " + _STORE_ + ".promocion p ON a.id_agencia = p.id_agencia WHERE MATCH (a.criterio) AGAINST (?) OR MATCH (p.criterio) AGAINST (?)"

const _CRITERIO =
    ` WHERE a.activo = 1 AND s.id_urbe = ? AND (s.tipo = 2 OR s.tipo = 3 OR s.tipo = 4) AND ? >= a.vs AND a.id_agencia IN (${STORE_CRITERIO_AGENCIA})  GROUP BY a.id_agencia ORDER BY MIN(IF(sh.id_sucursal IS NOT NULL, a.orden, 9999999)) ASC;`;


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
    var idAgencia = req.body.idAgencia;
    var pagina = req.body.pagina;
    var idaplicativo = req.headers.idaplicativo;
    var desde = (pagina * 30);
    desde = (pagina == 0) ? pagina : desde;
    var perfil = req.body.perfil;
    var SQL_;
    var SQL_COUNT_;
    if (!perfil)
        perfil = 0;

    var alias = req.body.alias;
    if (!alias)
        alias = '';
    alias = limpiar(alias.trim());
    var palabras = alias.split(' ');
    var SQLLIKE_ = '';
    for (let index = 0; index < palabras.length; index++) {
        if (index == 0)
            SQLLIKE_ = ` p.producto LIKE '%${palabras[index]}%' `;
        else
            SQLLIKE_ = SQLLIKE_ + ` OR p.producto LIKE '%${palabras[index]}%' `;
    }

    var idPromocion = req.body.idPromocion;
    if (!idPromocion)
        idPromocion = 0;

    if (perfil == '1') {
        SQL_ = "SELECT p.id_registro, p.visible, p.aprobado, p.promocion, p.destacado, p.productos, p.activo AS estado, 'Agotado' AS mensaje, p.activo, p.tipo, p.id_urbe, p.inventario, p.id_promocion, p.id_agencia, incentivo, producto, descripcion, precio, imagen, minimo, maximo "
            + " FROM " + _STORE_ + ".promocion p "
            + ` WHERE p.id_promocion = ? OR (p.id_agencia = ? AND (${SQLLIKE_})) ORDER BY p.id_promocion = ? DESC, p.promocion DESC, p.orden ASC LIMIT `;

        var SQL_COUNT_ = "SELECT COUNT(*) AS total "
            + " FROM " + _STORE_ + ".promocion p "
            + ` WHERE p.id_promocion = ? OR (p.id_agencia = ? AND (${SQLLIKE_})) LIMIT 1;`;

    }
    else {
        data.consultar(STORE_VIEWS, [idCliente, idAgencia]);
        SQL_ = "SELECT p.id_registro, p.visible, p.aprobado, p.promocion, p.destacado, p.productos, p.activo AS estado, 'Agotado' AS mensaje, p.activo, p.tipo, p.id_urbe, p.inventario, p.id_promocion, p.id_agencia, incentivo, producto, descripcion, precio, imagen, minimo, maximo "
            + " FROM " + _STORE_ + ".promocion p "
            + ` WHERE p.id_promocion = ? OR (p.id_agencia = ? AND p.aprobado = 1 AND p.visible = 1 AND (${SQLLIKE_})) AND (p.activo = 1 OR (p.activo = 0 AND p.fecha_actualizo >  DATE_SUB(NOW(), INTERVAL 5 DAY))) ORDER BY p.id_promocion = ? DESC, p.promocion DESC, p.activo DESC, p.orden ASC LIMIT `;

        var SQL_COUNT_ = "SELECT COUNT(*) AS total "
            + " FROM " + _STORE_ + ".promocion p "
            + ` WHERE p.id_promocion = ? OR (p.id_agencia = ? AND p.aprobado = 1 AND p.visible = 1 AND (${SQLLIKE_})) AND (p.activo = 1 OR (p.activo = 0 AND p.fecha_actualizo >  DATE_SUB(NOW(), INTERVAL 5 DAY))) LIMIT 1;`;
    }

    data.consultarRes(SQL_ + desde + ", 30;", [idPromocion, idAgencia, idPromocion], function (promociones) {
        data.consultarRes(SQL_COUNT_, [idPromocion, idAgencia], function (registros) {
            return res.status(200).send({ estado: 1, promociones: promociones, total: registros[0]['total'] });
        }, res);
    }, res);

}

function limpiar(s) {
    var r = s.toLowerCase();
    r = r.replace(new RegExp(/\s/g), " ");
    r = r.replace(new RegExp(/[àáâãäå]/g), "a");
    r = r.replace(new RegExp(/[èéêë]/g), "e");
    r = r.replace(new RegExp(/[ìíîï]/g), "i");
    r = r.replace(new RegExp(/ñ/g), "n");
    r = r.replace(new RegExp(/[òóôõö]/g), "o");
    r = r.replace(new RegExp(/[ùúûü]/g), "u");
    return r;
}

var STORE_VIEWS =
    "INSERT INTO `" + _STORE_ + "_data`.`view` (`id_cliente`, `id_agencia`, `views`) VALUES (?, ?, '1') ON DUPLICATE KEY UPDATE views = views + 1;";

module.exports = router;