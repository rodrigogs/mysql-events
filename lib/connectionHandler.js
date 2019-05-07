const debug = require('debuggler')()
const mysql = require('mysql')
const Connection = require('mysql/lib/Connection')
const Pool = require('mysql/lib/Pool')

const connect = connection => {
  new Promise((resolve, reject) => {
    if (connection instanceof Pool) {
      connection.getConnection(function (err, conn) {
        if (err) {
          return reject(err)
        }
        resolve(conn)
      })
    } else {
      connection.connect(err => {
        if (err) return reject(err)
        resolve()
      })
    }
  })
}

const connectionHandler = async connection => {
  if (connection instanceof Connection) {
    debug('creating connection from previous connection object:', connection)
    if (connection.state !== 'connected') {
      connection = mysql.createConnection(connection.config)
    }
  }

  if (typeof connection === 'string') {
    debug('creating connection from string:', connection)
    connection = mysql.createConnection(connection)
  }

  if (
    typeof connection === 'object' &&
    !(connection instanceof Connection || connection instanceof Pool)
  ) {
    debug('creating connection from object:', connection)
    if ('isPool' in connection) {
      if (connection.isPool === true) {
        connection = mysql.createPool(connection)
      } else {
        connection = mysql.createConnection(connection)
      }
    } else {
      connection = mysql.createConnection(connection)
    }
  }
  if (connection.state !== 'connected') {
    debug('initializing connection')
    await connect(connection)
  }

  return connection
}

module.exports = connectionHandler
