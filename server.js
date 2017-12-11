//#!/usr/bin/env node
"use strict";

//module dependencies
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const errorhandler = require('errorhandler');
const express = require('express');
const methodOverride = require('method-override');
const logger = require('morgan');
const path = require('path');
const debug = require("debug")("express:server");
const http = require("http");
const helmet = require('helmet');
const mysql = require('mysql');

// setup mysql connection
const pool = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'tmsdatabase',
  connectionLimit: 50
});

pool.getConnection(function(err, conn) {
  if (err) {
    console.error(err);
    console.error('error connecting: ' + err.stack);
    gracefulShutdown();
    return;
  }

  console.log('connected as id ' + conn.threadId);
  conn.release();
});

// setup server
const app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

// setup security
app.use(helmet());

// setup cross domain
const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Access-Token');

  next();
};
app.use(allowCrossDomain);

// mount logger
app.use(logger('dev'));

// mount json form parser
app.use(bodyParser.json());

// use gzip
app.use(compression());

// mount query string parser
app.use(bodyParser.urlencoded({
  extended: true
}));

// mount cookie parker
app.use(cookieParser('CRYPTO_SERVER'));

// mount override?
app.use(methodOverride());

// catch 404 and forward to error handler
app.use((err, req, res, next) => {
    err.status = 404;
    next(err);
});

// error handling
if (process.env.NODE_ENV === 'development' || typeof process.env.NODE_ENV === 'undefined') {
  // only use in development 
  app.use(errorhandler());
}

// X-Powered-By header 
app.disable('x-powered-by');

// setup routes
const { setUpRoutes } = require('./routes');
// console.log(routes.setUpRoutes);
setUpRoutes(app, pool);

//create http server
const httpPort = normalizePort(3000);
app.set("port", httpPort);
const httpServer = http.createServer(app);

//listen on provided ports
httpServer.listen(httpPort);

//add error handler
httpServer.on("error", onError);

//start listening on port
httpServer.on("listening", onListening);

// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log("Received kill signal, shutting down gracefully.");
  pool.end(function (err) {
    console.error(err);
  });
  // bootstrap.gracefulShutdown();
  httpServer.close(function() {
    console.log("Closed out remaining connections.");
    process.exit();
  });
  
   // if after 
   setTimeout(function() {
       console.error("Could not close connections in time, forcefully shutting down");
       process.exit();
  }, 5*1000);
}


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (val !== null && val !== undefined && typeof val !== undefined) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof httpPort === "string"
    ? "Pipe " + httpPort
    : "Port " + httpPort;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  console.log("Listening on " + bind);
}