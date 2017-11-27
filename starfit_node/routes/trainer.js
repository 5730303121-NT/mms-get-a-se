var express = require('express');
var router = express.Router();

var Users = require('../models/users');
var Services = require('../models/services');

// var trainerChecker = function (req) {
//   if (req.session.user) {
//     if(req.session.user.trainer){
//       return true;
//     }else{
//       return false;
//     }

//   } else {
//       return false;
//   }
// };

router.use(function (req, res, next) {
  if (req.session.user) {
    //login
    next();
  } else {
    req.flash("error", "please login");
    res.redirect('/');
  }
});


//get trainer page
router.get('/', function (req, res, next) {
  res.render('trainer', {
    title: 'Starfit : Trainer',
    style: 'style'
  });
});

router.get('/addservice', function (req, res, next) {
  res.render('add_service', {
    title: 'Starfit : Add Service',
    style: 'style'
  });
});



//service addservice
router.post('/addservice', function (req, res, next) {
  console.log("==================addservice====================");
  console.log("req = ", req.body);
  var newservice = {
    name: req.body.name,
    ttype: req.body.ttype,
    rating: 0,
    about: req.body.about,
    price: req.body.price,
    tid: req.session.user.id,
    place: req.body.location,
    status: "busy",
    images: ["default", "default", "default"]
  };
  //timeSlots
  var timeSlots = [];
  for (var i = 0; i < req.body.date.length; i++) {
    var slot = {};
    slot.day = req.body.date[i];
    var time = req.body.time[i].split('-');
    console.log(time);
    slot.time = [Number(time[0]), Number(time[1])];
    slot.available = true;
    slot.id = slot.day + "-" + slot.time[0] + "-" + slot.time[1];
    timeSlots.push(slot);
    newservice.status = "available";
  }
  newservice.timeSlots = timeSlots;

  //additional services
  var addServ = [];
  if (req.body.addserv) {
    for (var i = 0; i < req.body.addserv.length; i++) {
      var serv = {};
      serv.name = req.body.addserv[i];
      serv.price = req.body.addprice[i];
      addServ.push(serv);
    }
    newservice.addServ = addServ;
  }

  console.log("newservice = ", JSON.stringify(newservice));
  Services.addService(newservice, (err, services) => {
    if (err) {
      console.log("addService error");
      req.flash('error', "Something blew up during addService.");
      res.redirect("/");
    } else {
      console.log("service = ", services);
      req.flash('success', "Create new Service successful.");
      res.redirect('/');
    }
  });
});



//update service
router.post('/edit/:sid/update', function (req, res, next) {
  var sid = req.params.sid;
  var updateservice = {
    name: req.body.name,
    ttype: req.body.ttype,
    about: req.body.about,
    price: req.body.price,
    //place: req.body.place,
  };

  var timeSlots = [];
  for (var i = 0; i < req.body.date.length; i++) {
    var slot = {};
    slot.day = req.body.date[i];
    var time = req.body.time[i].split('-');
    console.log(time);
    slot.time = [Number(time[0]), Number(time[1])];
    slot.available = true;
    slot.id = slot.day + "-" + slot.time[0] + "-" + slot.time[1];
    timeSlots.push(slot);
    updateservice.status = "available";
  }
  //updateservice.timeSlots = timeSlots;

  //additional services
  var addServ = [];
  for (var i = 0; i < req.body.addserv.length; i++) {
    var serv = {};
    serv.name = req.body.addserv[i];
    serv.price = req.body.addprice[i];
    addServ.push(serv);
  }
  updateservice.addServ = addServ;
  console.log("update service = ", JSON.stringify(updateservice));
  Services.updateService(sid, updateservice, null, (err, user) => {
    console.log("update");
    if (err) {
      console.log(err);
      req.flash('error', "Something error.");
    }
    req.flash('success', "Update is successful.");
    res.redirect("back");
  });
});

router.get('/myservice', function (req, res, next) {
  var uid = req.session.user.id;
  console.log("==============myservices===============");
  var tid = req.session.user.id;
  Services.getService({
    tid: tid
  }, (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log('services =', result);
    var ret = {};
    ret.results = [];
    var newArray = [];

    //star calculator
    for (var i = 0; i < result.length; i++) {
      var rate = result[i].rating;
      result[i].fullstar = 0;
      result[i].halfstar = 0;
      while (rate >= 1) {
        rate--;
        result[i].fullstar++;
      }
      if (rate > 0) {
        result[i].halfstar = 1;
      }
      result[i].emptystar = 5 - result[i].fullstar - result[i].halfstar;
      result[i].emptystar = 5 - result[i].fullstar - result[i].halfstar;
      //calculating availability
      result[i].status = "busy";
      for (var j = 0; j < result[i].timeSlots.length; j++) {
        if (result[i].timeSlots[j].available) {
          result[i].status = "available";
          break;
        }
      }
    }


    //search result calculator
    for (var i = 0; i < result.length; i++) {
      if (i % 3 == 0) {
        newArray = [];
      }
      newArray.push(result[i]);
      if (i % 3 == 2) {
        ret.results.push(newArray);
      }
    }
    console.log("newArray ", newArray);
    if ((result.length % 3) > 0) {
      ret.results.push(newArray);
    }

    ret.isSearch = true;
    ret.results_count = result.length;
    console.log('ret ', ret);
    //res.status(200).send(ret);
    res.render('my_services', {
      title: 'Starfit : My Services',
      style: 'style',
      search: ret
    });
  });
});

router.get('/edit/:sid', (req, res, next) => {
  var uid = req.session.user.id;
  var sid = req.params.sid;
  Services.getServiceById(sid, (err, service) => {
    if (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect('/');
    }
    console.log("service =", service);
    res.render('edit_service', {
      title: 'Starfit : ' + service.name,
      style: 'style',
      service: service
    });
  });
});

module.exports = router;