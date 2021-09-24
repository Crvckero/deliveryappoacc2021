const app = require('../app.js');

module.exports = {
    notificarBienbenida: notificarBienbenida,
    notificarRecuperarContrasenia: notificarRecuperarContrasenia,
    notificarCompra: notificarCompra
};

function notificarCompra(idAplicativo, idCliente, cliente, correo, detalle, amount, id, code) {
    app.send(idAplicativo, function (mailEnvio) {
        mailEnvio['mail'].sendMail({
            from: mailEnvio['from'],
            to: cliente + ' <' + correo + '>',
            subject: amount + ' tu pago en: ' + mailEnvio['app'],
            html:
                mailEnvio['head'] +
                '<body width="100%" bgcolor="#F1F1F1" style="margin: 0; mso-line-height-rule: exactly;">' +
                '<center style="width: 100%; background: #F1F1F1; text-align: left;"> ' +
                '<div>' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 680px;" >' +
                '<tr> ' +
                '<td bgcolor="#26a4d3" align="center" valign="top" style="text-align: center; background-position: center center !important; background-size: cover !important;">' +
                '<div>' +
                '<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width:500px; margin: auto;">' +
                '<tr>' +
                '<td style="font-size:20px; ">&nbsp;</td>' +
                '</tr>' +
                '<tr>' +
                '<td align="center" valign="middle">' +
                '<table>' +
                '<tr>' +
                '<td valign="top" style="text-align: center;color: #FFFFFF;">' +
                '<h1 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 30px; line-height: 36px; font-weight: bold; color: #00000;">'

                + 'Querid@ ' + cliente + '</h1>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="top" style="text-align: center; font-family: sans-serif; font-size: 15px; color: #00000;">' +
                '<p style="margin: 0;">Hemos recibido tu pago.</p>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="top" align="center" style="text-align: center;">' +
                '<center>' +
                '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="center-on-narrow" style="text-align: center;">' +
                '<tr>' +
                '<td style="border-radius: 50px; background: #26a4d3; text-align: center;" class="button-td">' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</center>' +
                '</td>' +
                '</tr> ' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td style="font-size:20px; ">&nbsp;</td>' +
                '</tr>' +
                '</table>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#ffffff">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 40px 40px 20px 40px; text-align: left;">' +
                '</td>' +
                '</tr> ' +


                '<tr>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 15px; color: #555555; text-align: left; font-weight:normal;">' +
                '<p style="margin: 0;">'
                + detalle + '</p>' +
                '</td>' +
                '</tr>' +

                '<tr>' +
                '<td align="left" style="padding: 0px 40px 40px 40px;">' +
                '<table align="left">' +
                '<tr>' +
                '<td width="100%"> ' +


                '<table width="" cellpadding="0" cellspacing="0" border="0">' +

                '<tr>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 16; color: #555555; text-align: left; font-weight:normal;">' +
                'TOTAL:' +
                '</td>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 16; color: #555555; text-align: left; font-weight:bold;">' +
                amount +
                '</td>' +
                '</tr>' +

                '<tr>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 14; color: #555555; text-align: left; font-weight:normal;">' +
                'TRANSACTION ID:' +
                '</td>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 14; color: #555555; text-align: left; font-weight:bold;">' +
                id +
                '</td>' +
                '</tr>' +

                '<tr>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 14; color: #555555; text-align: left; font-weight:normal;">' +
                'AUTHORIZATION CODE' +
                '</td>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 14; color: #555555; text-align: left; font-weight:bold;">' +
                code +
                '</td>' +
                '</tr>' +



                '</table>' +
                '</td> ' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#26a4d3">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 40px 40px 5px 40px; text-align: center;">' +
                '<h3 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 20px; line-height: 24px; color: #00000; font-weight: normal;">'
                + mailEnvio['head_bienvanida'] + '</h3>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td font-family: sans-serif; font-size: 17px; line-height: 23px; color: #00000; text-align: center; font-weight:normal;">' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="middle" align="center" style="text-align: center;">' +
                '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="center-on-narrow">' +
                '<tr>' +
                '<td style="border-radius: 50px; background: #ffffff; text-align: center;" class="button-td">' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#292828">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 30px 30px; text-align: center;">'

                + mailEnvio['footer']
        }, function () {
        });
    });
}

function notificarBienbenida(idAplicativo, idCliente, cliente, correo, contrasenia) {
    app.send(idAplicativo, function (mailEnvio) {
        mailEnvio['mail'].sendMail({
            from: mailEnvio['from'],
            to: cliente + ' <' + correo + '>',
            subject: 'Bienvenid@ a ' + mailEnvio['app'],
            html:
                mailEnvio['head'] +
                '<body width="100%" bgcolor="#F1F1F1" style="margin: 0; mso-line-height-rule: exactly;">' +
                '<center style="width: 100%; background: #F1F1F1; text-align: left;"> ' +
                '<div>' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 680px;" >' +
                '<tr> ' +
                '<td bgcolor="#26a4d3" align="center" valign="top" style="text-align: center; background-position: center center !important; background-size: cover !important;">' +
                '<div>' +
                '<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width:500px; margin: auto;">' +
                '<tr>' +
                '<td style="font-size:20px; ">&nbsp;</td>' +
                '</tr>' +
                '<tr>' +
                '<td align="center" valign="middle">' +
                '<table>' +
                '<tr>' +
                '<td valign="top" style="text-align: center;color: #FFFFFF;">' +
                '<h1 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 30px; line-height: 36px; font-weight: bold; color: #00000;">'

                + 'Bienvenid@ ' + cliente + '</h1>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="top" style="text-align: center; font-family: sans-serif; font-size: 15px; color: #00000;">' +
                '<p style="margin: 0;">'

                + mailEnvio['slogan'] + '</p>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="top" align="center" style="text-align: center;">' +
                '<center>' +
                '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="center-on-narrow" style="text-align: center;">' +
                '<tr>' +
                '<td style="border-radius: 50px; background: #26a4d3; text-align: center;" class="button-td">' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</center>' +
                '</td>' +
                '</tr> ' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td style="font-size:20px; ">&nbsp;</td>' +
                '</tr>' +
                '</table>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#ffffff">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 40px 40px 20px 40px; text-align: left;">' +
                '<h3 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 20px; line-height: 26px; color: #333333; font-weight: bold;">'

                + 'TU CUENTA ESTA AHORA ACTIVA</h3>' +
                '</td>' +
                '</tr> ' +
                '<tr>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 20px; color: #555555; text-align: left; font-weight:normal;">' +
                '<p style="margin: 0;">'

                + 'Tu contraseña de acceso es:</p>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td align="left" style="padding: 0px 40px 40px 40px;">' +
                '<table width="180" align="left">' +
                '<tr>' +
                '<td width="110"> ' +
                '<table width="" cellpadding="0" cellspacing="0" border="0">' +
                '<tr>' +
                '<td align="left" style="font-family: sans-serif; font-size:22px;font-weight:bold;" class="body-text">' +
                '<p style="font-family: "Montserrat", sans-serif; font-size:22px;font-weight:bold; padding:0; margin:0;" class="body-text">'

                + contrasenia + '</p>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td> ' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#26a4d3">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 40px 40px 5px 40px; text-align: center;">' +
                '<h3 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 20px; line-height: 24px; color: #00000; font-weight: bold;">'
                + mailEnvio['head_bienvanida'] + '</h3>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td font-family: sans-serif; font-size: 17px; line-height: 23px; color: #00000; text-align: center; font-weight:normal;">' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="middle" align="center" style="text-align: center;">' +
                '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="center-on-narrow">' +
                '<tr>' +
                '<td style="border-radius: 50px; background: #ffffff; text-align: center;" class="button-td">' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#292828">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 30px 30px; text-align: center;">'

                + mailEnvio['footer']
        }, function () {
        });
    });
}

function notificarRecuperarContrasenia(idAplicativo, idCliente, cliente, correo, contrasenia) {
    app.send(idAplicativo, function (mailEnvio) {
        mailEnvio['mail'].sendMail({
            from: mailEnvio['from'],
            to: cliente + ' <' + correo + '>',
            subject: contrasenia + ' es la contraseña de recuperación de tu cuenta ' + mailEnvio['app'],
            html:
                mailEnvio['head'] +
                '<body width="100%" bgcolor="#F1F1F1" style="margin: 0; mso-line-height-rule: exactly;">' +
                '<center style="width: 100%; background: #F1F1F1; text-align: left;"> ' +
                '<div>' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 680px;" >' +
                '<tr> ' +
                '<td bgcolor="#26a4d3" align="center" valign="top" style="text-align: center; background-position: center center !important; background-size: cover !important;">' +
                '<div>' +
                '<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width:500px; margin: auto;">' +
                '<tr>' +
                '<td style="font-size:20px; ">&nbsp;</td>' +
                '</tr>' +
                '<tr>' +
                '<td align="center" valign="middle">' +
                '<table>' +
                '<tr>' +
                '<td valign="top" style="text-align: center;color: #FFFFFF;">' +
                '<h1 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 30px; line-height: 36px; font-weight: bold; color: #00000;">'

                + 'Querid@ ' + cliente + '</h1>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="top" style="text-align: center; font-family: sans-serif; font-size: 15px; color: #00000;">' +
                '<p style="margin: 0;">Se ha recuperado tu contraseña</p>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="top" align="center" style="text-align: center;">' +
                '<center>' +
                '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="center-on-narrow" style="text-align: center;">' +
                '<tr>' +
                '<td style="border-radius: 50px; background: #26a4d3; text-align: center;" class="button-td">' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</center>' +
                '</td>' +
                '</tr> ' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td style="font-size:20px; ">&nbsp;</td>' +
                '</tr>' +
                '</table>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#ffffff">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 40px 40px 20px 40px; text-align: left;">' +
                '</td>' +
                '</tr> ' +
                '<tr>' +
                '<td style="padding: 0px 40px 20px 40px; font-family: sans-serif; font-size: 20px; color: #555555; text-align: left; font-weight:normal;">' +
                '<p style="margin: 0;">'

                + 'Tu contraseña de acceso es:</p>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td align="left" style="padding: 0px 40px 40px 40px;">' +
                '<table width="180" align="left">' +
                '<tr>' +
                '<td width="110"> ' +
                '<table width="" cellpadding="0" cellspacing="0" border="0">' +
                '<tr>' +
                '<td align="left" style="font-family: sans-serif; font-size:22px;font-weight:bold;" class="body-text">' +
                '<p style="font-family: "Montserrat", sans-serif; font-size:22px;font-weight:bold; padding:0; margin:0;" class="body-text">'

                + contrasenia + '</p>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td> ' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#26a4d3">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 40px 40px 5px 40px; text-align: center;">' +
                '<h3 style="margin: 0; font-family: "Montserrat", sans-serif; font-size: 20px; line-height: 24px; color: #00000; font-weight: bold;">'
                + mailEnvio['head_bienvanida'] + '</h3>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td font-family: sans-serif; font-size: 17px; line-height: 23px; color: #00000; text-align: center; font-weight:normal;">' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td valign="middle" align="center" style="text-align: center;">' +
                '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="center-on-narrow">' +
                '<tr>' +
                '<td style="border-radius: 50px; background: #ffffff; text-align: center;" class="button-td">' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td bgcolor="#292828">' +
                '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
                '<tr>' +
                '<td style="padding: 30px 30px; text-align: center;">'

                + mailEnvio['footer']
        }, function () {
        });
    });
}