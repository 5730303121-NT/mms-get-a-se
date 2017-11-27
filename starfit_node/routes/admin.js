var express = require('express');
var router = express.Router();

var Users = require('../models/users');
var Services = require('../models/services');

var adminChecker = function (req) {
  if (req.session.user) {
    if (req.session.user.isAdmin) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};


// if (adminChecker(req)) {
//   //login
//   next();
// } else {
//   req.flash("error","Please login with admin account");
//   res.redirect('/');
// }


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('admin', {
    title: 'Starfit : Admin',
    style: 'style',
    layout: false
  });
});

router.get('/signout', function (req, res, next) {
  console.log("session ", req.session);
  if (req.session) {
    // delete session object
    req.session = null
    res.redirect('/admin');
    console.log("session ", req.session);
  }
});

router.post('/signin', function (req, res, next) {
  var email = req.body.email.toLowerCase(),
    password = req.body.password;
  //find one in db
  Users.getUserByE(email, (err, user) => {
    if (err) {
      console.log(err);
    }
    // console.log(user);
    // console.log('if' , !user);
    // console.log("password " , password);

    if (!user) {
      ////no user
      req.flash('error', "Incorrect email or password");
      res.redirect("/admin");
    } else if (user.password != password) {
      // console.log("correct pw " , user.password);
      console.log("wrong pw");
      //wrong pw
      req.flash('error', "Incorrect email or password");
      res.redirect("/admin");
    } else {
      //login sucssessful
      if (user.isAdmin) {
        var userdata = {
          id: user._id,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          phone: user.phone,
          image: user.image,
          reservations: user.reservations,
          isAdmin: true,
          login: true
        };
        console.log("userdata = ", userdata);
        req.flash('success', "Login is successful.");
        req.session.user = userdata;
        res.redirect('/admin/ban');
      } else {
        req.flash('error', "Incorrect email or password");
        res.redirect("/admin");
      }
    }
  });
  console.log("session ", req.session);
});

router.get('/ban', function (req, res, next) {
  if (adminChecker(req)) {
    var query = {
      "reviews.isReport": true
    }
    var reportedReview = [];
    Services.find(query).lean().exec(function (err, result) {
      for (var i = 0; i < result.length; i++) {
        if (result[i].reviews) {
          var reviews = result[i].reviews;
          for (var j = 0; j < reviews.length; j++) {
            if (reviews[j].isReport) {
              reportedReview.push(reviews[j]);
            }
          }
        }
      }
      console.log("Report reviews : ", reportedReview);
      res.render('ban', {
        title: 'Starfit : Admin',
        style: 'style',
        layout: false,
        reports: reportedReview
      });
    });
  } else {
    req.flash('error', "Please login as admin");
    res.redirect("/admin");
  }
});

router.get('/delete/:sid/:rev_id', function (req, res, next) {
  if (adminChecker(req)) {
    var sid = req.params.sid;
    var rev_id = req.params.rev_id;
    var query = {
      $pull: {
        reviews: {
          rev_id: rev_id
        }
      }
    };
    Services.updateService(sid, query, null, function (err, result) {
      if (err) {
        console.log(err);
      }
      Services.getServiceById(sid, (err, result) => {
        var sum_review = 0;
        console.log("result ====== ", result.reviews)
        if (result.reviews) {
          if (result.reviews.length > 0) {
            var reviews = result.reviews;
            for (var i = 0; i < reviews.length; i++) {
              sum_review += reviews[i].rating;
            }
            sum_review = sum_review / reviews.length;
          }
        }
        var query2 = {
          "rating": sum_review
        }
        Services.updateService(sid, query2, null, function (err, result) {
          if (err) {
            console.log(err);
          }
          req.flash('success', "Delete is successful.");
          res.redirect("/admin/ban");
        });
      })
    });
  } else {
    req.flash('error', "Please login as admin");
    res.redirect("/admin");
  }
});

module.exports = router;