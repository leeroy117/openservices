var config = require('../credenciales/dbConfig');
require('dotenv').config();

global.connection = module.exports = function() {};

createDBConnection = function() {
    
    if (process.env.NODE_ENV != "production") {

        var mysqlConnection = mysql.createConnection({
            host: config.mysqlConfigDesarrollo.host,
            user: config.mysqlConfigDesarrollo.user,
            password: config.mysqlConfigDesarrollo.password,
            database: config.mysqlConfigDesarrollo.database,
            connectTimeout: config.mysqlConfigDesarrollo.timeout
        });
        
        return mysqlConnection;
    }


    var mysqlConnection = mysql.createConnection({
        host: config.mysqlConfigProduction.host,
        user: config.mysqlConfigProduction.user,
        password: config.mysqlConfigProduction.password,
        database: config.mysqlConfigProduction.database,
        connectTimeout: config.mysqlConfigProduction.timeout
    });

    console.log('mysqlconnection',mysqlConnection);

    return mysqlConnection;
};

connection.invokeQuery = function(sqlQuery, resRows) {
    var ssh = new SSH2client();
    if (process.env.NODE_ENV != 'production') {
        ssh.connect(config.sshTunnelConfigDesarrollo);

        console.log('log');
    }else{
        ssh.connect(config.sshTunnelConfigProduction);
    }

    ssh.on('ready', function() {
        ssh.forwardOut(
            config.localhost,
            (process.env.NODE_ENV != 'production') ? config.mysqlConfigDesarrollo.timeout : config.mysqlConfigProduction.timeout,
            config.localhost,
            (process.env.NODE_ENV != 'production') ? config.mysqlConfigDesarrollo.port : config.mysqlConfigProduction.port,
            function(err, stream) {
                if (err) { console.log('err',err) };

                var db = {};

                if (process.env.NODE_ENV != 'production') {
                    config.mysqlConfigDesarrollo.stream = stream;
                    db = mysql.createConnection(config.mysqlConfigDesarrollo);
                }else{
                    config.mysqlConfigProduction.stream = stream;
                    db = mysql.createConnection(config.mysqlConfigProduction);
                }
                // var db = mysql.createConnection(config.mysqlConfigDesarrollo);

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