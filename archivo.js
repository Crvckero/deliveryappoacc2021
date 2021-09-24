var admin = require("firebase-admin");
var fs = require('fs'), request = require('request');
var serviceAccount = require("./account_key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `gs://${_APN}`
});

module.exports = { crearImagen, subir };

function crearImagen(uri, filename, name, imei, callback) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', function () {
            subir(filename, name, imei, callback);
        });
    });
};

var bucket = admin.storage().bucket();

function subir(filename, name, imei, callback) {
    var options = {
        destination: name,
        resumable: true,
        validation: false,
        predefinedAcl: 'publicRead',
        metadata: {
            metadata: {
                imei: imei
            }
        }
    };
    bucket.upload(filename, options, function (err, file, apiResponse) {
        if (err) {
            console.log('archivo.js', err);
            return callback({ estado: -1 });
        }
        return callback({ estado: 1 });
    });
}