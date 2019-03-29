var mysql = require('mysql');

mysql.createConnection({ // POST 접속
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'nodejs',
    port : 3307
});
