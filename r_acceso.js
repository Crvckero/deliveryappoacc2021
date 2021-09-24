module.exports = (function (req, res, next) {

    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', true);
    }
    if (req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
    }
    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    }

    if (req.originalUrl == '/r' || req.method == 'GET') {
        return next();
    }

    var error = false;
    var codigo = 200;

    if (req.method != 'POST' && req.method != 'OPTIONS') {
        return res.redirect(307, 'https://www.facebook.com/planck.biz');
    }

    if (req.method == 'POST') {
        if (!req.headers['idaplicativo']) {
            error = true;
            codigo = 10000;

        }
        if (!req.headers['idplataforma']) {
            error = true;
            codigo = 10001;

        }
        if (!req.headers['imei']) {
            error = true;
            codigo = 10002;

        }
        if (!req.headers['marca']) {
            error = true;
            codigo = 10003;

        }
        if (!req.headers['modelo']) {
            error = true;
            codigo = 10004;

        }
        if (!req.headers['so']) {
            error = true;
            codigo = 10005;

        }
        if (!req.headers['vs']) {
            error = true;
            codigo = 10006;
        }
        if (!req.headers['key']) {
            error = true;
            codigo = 10007;

        }
        let versiones = '';
        try {
            versiones = req.headers['vs'].split('.');
        } catch (exception) {
            codigo = 101;
            error = true;
            return res.status(403).send({ error: codigo });
        }
        if (versiones.length != 3) {
            error = true;
            codigo = 10008;

        }
        if (isNaN(versiones[0])) {
            error = true;
            codigo = 10009;

        }
        if (isNaN(versiones[1])) {
            error = true;
            codigo = 10010;

        }
        if (isNaN(versiones[2])) {
            error = true;
            codigo = 10011;
        }
        if (error) {
            return res.status(403).send({ error: codigo });
        }
    }

    return next();
});