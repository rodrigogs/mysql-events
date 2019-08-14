const debug = require('debuggler')();
const mysql = require('mysql');
const Connection = require('mysql/lib/Connection');
const Pool = require('mysql/lib/Pool');

const connect = connection => new Promise((resolve, reject) => connection.connect((err) => {
  if (err) return reject(err);
  resolve();
}));

const connectionHandler = async (connection) => {
  if (connection instanceof Pool) {
    debug('reusing pool:', connection);
    if (connection._closed) {
      connection = mysql.createPool(connection.config.connectionConfig);
    }
  }

  if (connection instanceof Connection) {
    debug('reusing connection:', connection);
    if (connection.state !== 'connected') {
      connection = mysql.createConnection(connection.config);
    }
  }

  if (typeof connection === 'string') {
    debug('creating connection from string:', connection);
    connection = mysql.createConnection(connection);
  }

  if ((typeof connection === 'object') && (!(connection instanceof Connection) && !(connection instanceof Pool))) {
    debug('creating connection from object:', connection);
    if (connection.config) {
      connection = mysql.createConnection(connection.config);
    } else {
      if (connection.isPool) {
        connection = mysql.createPool(connection);
      } else {
        connection = mysql.createConnection(connection);
      }
    }
  }

  if ((connection instanceof Connection) && (connection.state !== 'connected')) {
    debug('initializing connection');
    await connect(connection);
  }

  return connection;
};

module.exports = connectionHandler;
