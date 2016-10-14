var path = require('path');
var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/test');


var Link;
var User;

var db = mongoose.connection;

var createSchema = function() {
  var linkSchema = new Schema({
    url: String,
    baseUrl: String,
    code: String,
    title: String,
    visits: {type: Number, default: 0 }
  });

  linkSchema.methods.hashUrl = function () {
    var shasum = crypto.createHash('sha1');
    shasum.update(this.get('url'));
    this.set('code', shasum.digest('hex').slice(0, 5));
  };
  
  Link = mongoose.model('urls', linkSchema);
  exports.Link = Link;

  var userSchema = new Schema ({
    username: { type: String, unique: true, required: true },
    password: String
  });

  userSchema.methods.hashPassword = function () {
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.get('password'), null, null).bind(this)
      .then(function(hash) {
        this.set('password', hash);
      });
  };

  userSchema.methods.comparePassword = (attemptedPassword, userPass, callback) => {
    console.log('attempted password', attemptedPassword);
    console.log('input', userPass);
    bcrypt.compare(attemptedPassword, userPass, function(err, isMatch) {
      console.log(err);
      console.log('is match', isMatch);
      callback(isMatch);
    });
  };

  User = mongoose.model('users', userSchema);
  exports.User = User;
  console.log('create schema done');
};

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('opened mongoose');
  createSchema();
  db.Link = Link;
  db.User = User;
});

exports.db = db;


/*
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')z
  },
  useNullAsDefault: true
});
var db = require('bookshelf')(knex);
db.knex.schema.hasTable('users').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function (user) {
      user.increments('id').primary();
      user.string('username', 100).unique();
      user.string('password', 100);
      user.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('baseUrl', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

*/

