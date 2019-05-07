# mysql-events
[![CircleCI](https://circleci.com/gh/rodrigogs/mysql-events.svg)](https://circleci.com/gh/rodrigogs/mysql-events)
[![Code Climate](https://codeclimate.com/github/rodrigogs/mysql-events/badges/gpa.svg)](https://codeclimate.com/github/rodrigogs/mysql-events)
[![Test Coverage](https://codeclimate.com/github/rodrigogs/mysql-events/badges/coverage.svg)](https://codeclimate.com/github/rodrigogs/mysql-events/coverage)

A [node.js](https://nodejs.org) package that watches a MySQL database and runs callbacks on matched events.

This package is based on the [original ZongJi](https://github.com/nevill/zongji) and the [original mysql-events](https://github.com/spencerlambert/mysql-events) modules. Please make sure that you meet the requirements described at [ZongJi](https://github.com/rodrigogs/zongji#installation), like MySQL binlog etc.

Check [@kuroski](https://github.com/kuroski)'s [mysql-events-ui](https://github.com/kuroski/mysql-events-ui) for a `mysql-events` UI implementation.

## Install
```sh
npm install @rodrigogs/mysql-events
```

## Quick Start
```javascript
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');

const program = async () => {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
  });

  const instance = new MySQLEvents(connection, {
    startAtEnd: true,
    excludedSchemas: {
      mysql: true,
    },
  });

  await instance.start();

  instance.addTrigger({
    name: 'TEST',
    expression: '*',
    statement: MySQLEvents.STATEMENTS.ALL,
    onEvent: (event) => { // You will receive the events here
      console.log(event);
    },
  });
  
  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
};

program()
  .then(() => console.log('Waiting for database events...'))
  .catch(console.error);
```
[Check the examples](https://github.com/rodrigogs/mysql-events/examples)

## Usage
  ### #constructor(connection, options)
  - Instantiate and create a database connection using a DSN
    ```javascript
    const dsn = {
      host: 'localhost',
      user: 'username',
      password: 'password',
      isPool: true // create a pool instead of a single connection
    };

    const myInstance = new MySQLEvents(dsn, { /* ZongJi options */ });
    ```

  - Instantiate and create a database connection using a preexisting connection
    ```javascript
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'username',
      password: 'password',
    });

    const myInstance = new MySQLEvents(connection, { /* ZongJi options */ });
    ```
    OR 
    
    ```javascript
    const connection = mysql.createPool({
      host: 'localhost',
      user: 'username',
      password: 'password',
      connectionLimit: 10,
    });

    const myInstance = new MySQLEvents(connection, { /* ZongJi options */ });
    ```
  - Options(the second argument) is for ZongJi options
    ```javascript
    const myInstance = new MySQLEvents({ /* connection */ }, {
      serverId: 3,
      startAtEnd: true,
    });
    ```
    [See more about ZongJi options](https://github.com/rodrigogs/zongji#zongji-class)

  ### #start()
  - start function ensures that MySQL is connected and ZongJi is running before resolving its promise
    ```javascript
    myInstance.start()
      .then(() => console.log('I\'m running!'))
      .catch(err => console.error('Something bad happened', err));
    ```
  ### #stop()
  - stop function terminates MySQL connection and stops ZongJi before resolving its promise
    ```javascript
    myInstance.stop()
      .then(() => console.log('I\'m stopped!'))
      .catch(err => console.error('Something bad happened', err));
    ```
  ### #pause()
  - pause function pauses MySQL connection until `#resume()` is called, this it useful when you're receiving more data than you can handle at the time
    ```javascript
    myInstance.pause();
    ```
  ### #resume()
  - resume function resumes a paused MySQL connection, so it starts to generate binlog events again
    ```javascript
    myInstance.resume();
    ```
  ### #addTrigger({ name, expression, statement, onEvent })
  - Adds a trigger for the given expression/statement and calls the `onEvent` function when the event happens
    ```javascript
    instance.addTrigger({
      name: 'MY_TRIGGER',
      expression: 'MY_SCHEMA.MY_TABLE.MY_COLUMN',
      statement: MySQLEvents.STATEMENTS.INSERT,
      onEvent: async (event) => {
        // Here you will get the events for the given expression/statement.
        // This could be an async function.
        await doSomething(event);
      },
    });
    ```
  - The `name` argument must be unique for each expression/statement, it will be user later if you want to remove a trigger
    ```javascript
    instance.addTrigger({
      name: 'MY_TRIGGER',
      expression: 'MY_SCHEMA.*',
      statement: MySQLEvents.STATEMENTS.ALL,
      ...
    });

    instance.removeTrigger({
      name: 'MY_TRIGGER',
      expression: 'MY_SCHEMA.*',
      statement: MySQLEvents.STATEMENTS.ALL,
    });
    ```
  - The `expression` argument is very dynamic, you can replace any step by `*` to make it wait for any schema, table or column events
    ```javascript
    instance.addTrigger({
      name: 'Name updates from table USERS at SCHEMA2',
      expression: 'SCHEMA2.USERS.name',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All database events',
      expression: '*',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All events from SCHEMA2',
      expression: 'SCHEMA2.*',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All database events for table USERS',
      expression: '*.USERS',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All database events for table USERS',
      expression: '*.USERS',
      ...
    });
    ```
  - The `statement` argument indicates in which database operation an event should be triggered
    ```javascript
    instance.addTrigger({
      ...
      statement: MySQLEvents.STATEMENTS.ALL,
      ...
    });
    ```
    [Allowed statements](https://github.com/rodrigogs/mysql-events/blob/master/lib/STATEMENTS.enum.js)
  - The `onEvent` argument is a function where the trigger events should be threated
    ```javascript
    instance.addTrigger({
      ...
      onEvent: (event) => {
        console.log(event); // { type, schema, table, affectedRows: [], affectedColumns: [], timestamp, }
      },
      ...
    });
    ```
  ### #removeTrigger({ name, expression, statement })
  - Removes a trigger from the current instance
    ```javascript
    instance.removeTrigger({
      name: 'My previous created trigger',
      expression: '',
      statement: MySQLEvents.STATEMENTS.INSERT,
    });
    ```
  ### Instance events
  - MySQLEvents class emits some events related to its MySQL connection and ZongJi instance
    ```javascript
    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, (err) => console.log('Connection error', err));
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, (err) => console.log('ZongJi error', err));
    ```
  [Available events](https://github.com/rodrigogs/mysql-events/blob/master/lib/EVENTS.enum.js)

## Tigger event object
It has the following structure:
```javascript
{
  type: 'INSERT | UPDATE | DELETE',
  schema: 'SCHEMA_NAME',
  table: 'TABLE_NAME',
  affectedRows: [{
    before: {
      column1: 'A',
      column2: 'B',
      column3: 'C',
      ...
    },
    after: {
      column1: 'D',
      column2: 'E',
      column3: 'F',
      ...
    },
  }],
  affectedColumns: [
    'column1',
    'column2',
    'column3',
  ],
  timestamp: 1530645380029,
  nextPosition: 1343,
  binlogName: 'bin.001',
}
```

**Make sure the database user has the privilege to read the binlog on database that you want to watch on.**

## LICENSE
[BSD-3-Clause](https://github.com/rodrigogs/mysql-events/blob/master/LICENSE) © Rodrigo Gomes da Silva
