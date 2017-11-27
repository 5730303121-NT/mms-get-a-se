var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var containerized = require('containerized');
var fs = require('fs');
var multer = require('multer');
var uuid = require('uuid');
var flash = require('connect-flash');
var router = express.Router();
var dotenv = require('dotenv').config();

var hbs = require('hbs');
var cookieSession = require('cookie-session')

//routes
var service = require('./routes/service');
var trainer = require('./routes/trainer');
var admin = require('./routes/admin');
var api = require('./routes/api');
var images = require('./routes/images');
var index = require('./routes/index');

//mongo
var mongoose = require('mongoose');
var mongodbip = process.env.DB_HOST;

if (containerized()) {
    mongoose.connect('mongodb://database:27017/db', { useMongoClient: true });
} else {
    mongoose.connect('mongodb://'+mongodbip+'/db', { useMongoClient: true });
}

//db
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("connected to db")
});

// paypal
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAPAL_ID,
  'client_secret': process.env.PAPAL_SECRET
});

var app = express();

//session
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 2 * 60 * 60 * 1000 // 24 hours
}));
app.use(function (req, res, next) {
  req.sessionOptions.maxAge = req.session.maxAge || req.sessionOptions.maxAge
  next()
});
app.use(function (req, res, next) {
  req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
  next()
});
if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

//flash message
app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('times', function(n, block) {
  var accum = '';
  for(var i = 0; i < n; ++i)
      accum += block.fn(i);
  return accum;
});
hbs.registerHelper('eq', function(val, val2, block) {
  if(val == val2){
    return block.fn();
  }
});
hbs.registerHelper('noteq', function(val, val2, block) {
  if(val != val2){
    return block.fn();
  }
});
hbs.registerHelper("math", function(lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue
  }[operator];
});

app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  app.locals.message = {
      error: req.flash('error'),
      success: req.flash('success')
  }
  if (req.session.user) {
      var fullname = req.session.user.fname + " " + req.session.user.lname;
      req.session.user.name = fullname;
  }
  app.locals.account = req.session.user;
  console.log("req.session.user = ",req.session.user );
  next();
});

app.use('/', index);
app.use('/service', service);
app.use('/trainer', trainer);
app.use('/admin', admin);
app.use('/api', api);
app.use('/images', images);


// app.all('*', function(req, res) {
//   console.log("redirect all");
//   res.redirect("/");
// });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.locals.message = req.flash('error');
  var err = new Error('Not Found');
  err.status = 404;
  next();
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.message2 = req.flash('error');
  // res.locals.message3 = req.flash('success');
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
