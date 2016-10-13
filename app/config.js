var path = require('path');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
console.log('start mongooose server');
var Schema = mongoose.Schema;


var Link;
var User;


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
  userSchema.methods.comparePassword = (attemptedPassword, callback) => {
    bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
      callback(isMatch);
    });
  };
  User = mongoose.model('users', userSchema);
  exports.User = User;
  console.log('create schema done');
};

var db = mongoose.connection;
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

