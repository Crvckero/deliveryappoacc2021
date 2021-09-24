const nodemailer = require('nodemailer');
const accountTransport = require("./account_transport.json");

const mail_rover = nodemailer.createTransport(accountTransport);

const authorization1
    = 'key=AAAAPO-8k3I:APA91bFplhB8nkZVO_712SBF-A5NsW21cyv7OfGxOdpXClp3kmKu3zKL3BIh9BZ-Z5o_GUwpBws9oOk8pu15c9S6ukcCMrvP7nYpDkUY9DCFBcY4n-W-Hmw9RdI9O5lUQauIGgWgLHIp';

module.exports = {
    auth, dir, send, restringirApp, code_PMZ, key_PMZ, nombre, isExplorer
};

function nombre(idaplicativo) {
    var id = 0;
    try {
        var id = parseInt(idaplicativo);
    } catch (error) {
        console.log(`error parse aut app.js ${error}`)
    }
    switch (id) {
        case _ID_APP_1:
            return 'Curiosity';
        default:
            return 'Planck';
    }
};

function isExplorer(idCliente) {
    var id = 0;
    try {
        var id = parseInt(idCliente);
    } catch (error) {
        console.log(`error parse aut app.js ${error}`)
    }
    switch (id) {
        case _ID_EXPLORER_APP_1:
            return true;
        default:
            return false;
    }
};

function restringirApp(idaplicativo) {
    var id = 0;
    try {
        var id = parseInt(idaplicativo);
    } catch (error) {
        console.log(`error parse aut app.js ${error}`)
    }
    switch (id) {
        case -1:
            return 1; //Restringimos las solicitudes desde el APP ID a las motos con configuraciones en cliente_settings
        default:
            return 0;
    }
};

function code_PMZ(idaplicativo) {
    var id = 0;
    try {
        var id = parseInt(idaplicativo);
    } catch (error) {
        console.log(`error parse aut app.js ${error}`)
    }
    switch (id) {
        case _ID_APP_1:
            if (_ENVIRONMENT_ === 'developing') {
                return '';
            } else {
                return '';
            }
        default:
            return '';
    }
};

function key_PMZ(idaplicativo) {
    var id = 0;
    try {
        var id = parseInt(idaplicativo);
    } catch (error) {
        console.log(`error parse aut app.js ${error}`)
    }
    switch (id) {
        case _ID_APP_1:
            if (_ENVIRONMENT_ === 'developing') {
                return '';
            } else {
                return '';
            }
        default:
            return '';
    }
};

function auth(idaplicativo) {
    var id = 0;
    try {
        var id = parseInt(idaplicativo);
    } catch (error) {
        console.log(`error parse aut app.js ${error}`)
    }
    switch (id) {
        case _ID_APP_1:
            return authorization1;
        default:
            return authorization1;
    }
};

//Directorios de storage
function dir(idaplicativo) {
    var id = 0;
    try {
        var id = parseInt(idaplicativo);
    } catch (error) {
        console.log(`error parse dir app.js ${error}`)
    }
    switch (id) {
        case _ID_APP_1:
            return 'cr';
        default:
            return 'df';
    }
};

//Envia un mail
function send(idAplicativo, calback) {
    var id = 0;
    try {
        var id = parseInt(idAplicativo);
    } catch (error) {
        console.log(`error parse idAplicativo feedback.js ${error}`)
    }
    switch (id) {
        case _ID_APP_1:
            json = {
                url: _SERVER + 'curiosity/', mail: mail_rover, app: 'CURIOSITY', from: 'Curiosity <curiosity@planck.biz>',
                to: 'CURIOSITY <curiosity@planck.biz>',
                slogan: '😋 Comida exquisita, entregas simples. 🛵 Compra YA! 👇🏻',
                body_bienvanida: 'Mensaje personalizado', head_bienvanida: 'En Curiosity pide a tu local favorito, o chatea con un asesor por medicina, y te lo llevamos lo antes posible.',
                bcc: 'Info <info@planck.biz>', head: head, footer: footer
            };
            return calback(json);
        default:
            json = {
                url: _SERVER + 'curiosity/', mail: mail_rover, app: 'CURIOSITY', from: 'Curiosity <curiosity@planck.biz>',
                to: 'CURIOSITY <curiosity@planck.biz>',
                slogan: '😋 Comida exquisita, entregas simples. 🛵 Compra YA! 👇🏻',
                body_bienvanida: 'Mensaje personalizado', head_bienvanida: 'En Curiosity pide a tu local favorito, o chatea con un asesor por medicina, y te lo llevamos lo antes posible.',
                bcc: 'Info <info@planck.biz>', head: head, footer: footer
            };
            return calback(json);
    }
}

var head =
    '<!DOCTYPE html>' +
    '<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">' +
    '<head>' +
    '<meta charset="utf-8"> ' +
    '<meta name="viewport" content="width=device-width"> ' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge"> ' +
    '<meta name="x-apple-disable-message-reformatting"> ' +
    '<title>Curiosity</title> ' +
    '</head>';

var footer =
    '<table align="center" style="text-align: center;">' +
    '<tr>' +
    '<td>' +
    '<img src="' + _SERVER + 'curiosity/' + 'facebook.png" width="" height="" style="margin:0; padding:0; border:none; display:block;" border="0" alt="">' +
    '</td>' +
    '<td width="10">&nbsp;</td>' +
    '<td>' +
    '<img src="' + _SERVER + 'curiosity/' + 'twitter.png" width="" height="" style="margin:0; padding:0; border:none; display:block;" border="0" alt="">' +
    '</td>' +
    '<td width="10">&nbsp;</td>' +
    '<td>' +
    '<img src="' + _SERVER + 'curiosity/' + 'google.png" width="" height="" style="margin:0; padding:0; border:none; display:block;" border="0" alt="">' +
    '</td>' +
    '<td width="10">&nbsp;</td>' +
    '<td>' +
    '<img src="' + _SERVER + 'curiosity/' + 'linkedin.png" width="" height="" style="margin:0; padding:0; border:none; display:block;" border="0" alt="">' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr> ' +
    '<tr>' +
    '<td bgcolor="#ffffff">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding: 40px 40px 10px 40px; font-family: sans-serif; font-size: 12px; line-height: 18px; color: #666666; text-align: center; font-weight:normal;">' +
    '<p style="margin: 0;">'

    + 'CURIOSITY</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 0px 40px 10px 40px; font-family: sans-serif; font-size: 12px; line-height: 18px; color: #666666; text-align: center; font-weight:normal;">' +
    '<p style="margin: 0;">'

    + 'Si usted recibió este correo por error por favor comuniquese con: info@planck.biz</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 0px 40px 40px 40px; font-family: sans-serif; font-size: 12px; line-height: 18px; color: #666666; text-align: center; font-weight:normal;">' +
    '<p style="margin: 0;">'

    + 'Copyright &copy; 2019-2020 <b>PLANCK</b>, Todos los derechos reservados.</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr> ' +
    '</table>' +
    '</div>' +
    '</center>' +
    '</body>' +
    '</html>';