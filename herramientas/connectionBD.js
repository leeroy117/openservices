var config = require('../credenciales/dbConfig');

global.connection = module.exports = function() {};

createDBConnection = function() {
    var mysqlConnection = mysql.createConnection({
        host: config.mysqlConfigDesarrollo.host,
        user: config.mysqlConfigDesarrollo.user,
        password: config.mysqlConfigDesarrollo.password,
        database: config.mysqlConfigDesarrollo.database,
        connectTimeout: config.mysqlConfigDesarrollo.timeout
    });

    return mysqlConnection;
};

connection.invokeQuery = function(sqlQuery, resRows) {
    var ssh = new SSH2client();
    ssh.connect(config.sshTunnelConfigDesarrollo);

    ssh.on('ready', function() {
        ssh.forwardOut(
            config.localhost,
            config.mysqlConfigDesarrollo.timeout,
            config.localhost,
            config.mysqlConfigDesarrollo.port,
            function(err, stream) {
                if (err) { console.log(err) };

                config.mysqlConfigDesarrollo.stream = stream;
                var db = mysql.createConnection(config.mysqlConfigDesarrollo);

                db.query(sqlQuery, function(err, rows) {
                    if (err) {
                        console.log(err)
                        resRows(err)
                    } else {
                        resRows(rows);
                    }

                    db.end();
                    ssh.end();
                });
            }
        )
    })
};