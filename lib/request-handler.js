var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var assert = require('assert');
var config = require('../app/config');

var db;
var Link;
var User;

var MongoClient = require('mongodb').MongoClient;

var mongoUrl = 'mongodb://localhost:27017/test';

// Use connect method to connect to the server
MongoClient.connect(mongoUrl, function(err, db) {
  assert.equal(null, err);
  console.log('Connected successfully to server');
  config = require('../app/config');
  db = config.db;
  Link = config.Link;
  User = config.User;
  // db.close();
});

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Link.find({url: uri}).exec().then( function(link) {
    if (link) {
      res.status(200).send(link.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.hashUrl();
        newLink.save().then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
};

  /*
  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save().then(function(newLink) {
          Links.add(newLink);
          res.status(200).send(newLink);
        });
      });
    }
  });
};
  */


exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User.find({ username: username })
    .exec()
    .then(function(user) {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, function(match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        });
      }
    });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({ username: username })
    .exec()
    .then(function(user) {
      console.dir('signup user', user, typeof user);
      if (!user) {
        console.log('new user');
        var newUser = new User({
          username: username,
          password: password
        });
        newUser.save()
          .then(function(newUser) {
            Users.add(newUser);
            util.createSession(req, res, newUser);
          });
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    });
};

exports.navToLink = function(req, res) {
  Link.find({ code: req.params[0] }).exec().then(function(link) {
    console.log('link find', link);
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};





