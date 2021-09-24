var mysql = require('mysql');
var mysqlAccount = require("./mysql_cnf.json");
var pool = mysql.createPool(mysqlAccount);

module.exports = {
    consultar: consultar,
    consultarCallback: consultarCallback
};

function consultar(QUERY, VALORES) {
    pool.query(QUERY, VALORES, function (err) {
        if (err)
            console.error(err + ' SQL: ' + QUERY + ' VALORES: ' + VALORES);
    });
}

function consultarCallback(QUERY, VALORES, callback) {
    pool.query(QUERY, VALORES, function (err, ejecucion) {
        if (!err)
            return callback(ejecucion);
        console.error(err + ' SQL: ' + QUERY + ' VALORES: ' + VALORES);
        return callback({ error: 'Acceso denegado' });
    });
}