var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var containerized = require('containerized');
var fs = require('fs');
var multer = require('multer');

var hbs = require('hbs');
var session = require('express-session');

//routes
var index = require('./routes/index');
var service = require('./routes/service');
var trainer = require('./routes/trainer');
var api = require('./routes/api');
var images = require('./routes/images');

//mongo
var mongoose = require('mongoose');
var mongodbip = "192.168.99.100:27017";
if (containerized()) {
    mongoose.connect('mongodb://database:27017/db', { useMongoClient: true });
} else {
    mongoose.connect('mongodb://'+mongodbip+'/db', { useMongoClient: true });
}

//
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("connected to db")
});

var app = express();



//session
app.set('trust proxy', 1) // trust first proxy
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('times', function(n, block) {
  var accum = '';
  for(var i = 0; i < n; ++i)
      accum += block.fn(i);
  return accum;
});
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/service', service);
app.use('/trainer', trainer);
app.use('/api', api);
app.use('/images', images);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
