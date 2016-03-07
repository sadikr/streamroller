"use strict";
var BaseRollingFileStream = require('./BaseRollingFileStream')
  , debug = require('debug')('streamroller:RollingFileStream')
  , util = require('util')
  , path = require('path')
  , fs = require('fs')
  , async = require('async')
  , pathParse = require('path-parse');

module.exports = RollingFileStream;

function RollingFileStream (filename, size, backups, options) {
  this.size = size;
  this.backups = backups || 1;

  function throwErrorIfArgumentsAreNotValid() {
    if (!filename || !size || size <= 0) {
      throw new Error("You must specify a filename and file size");
    }
  }

  throwErrorIfArgumentsAreNotValid();

  RollingFileStream.super_.call(this, filename, options);
}
util.inherits(RollingFileStream, BaseRollingFileStream);

RollingFileStream.prototype.shouldRoll = function() {
  debug("should roll with current size %d, and max size %d", this.currentSize, this.size);
  return this.currentSize >= this.size;
};

RollingFileStream.prototype.roll = function(filename, callback) {
  var that = this;
  var filenamePath = parsePath(filename);
  var fileIndexSeparator = '__';
  var pattern = '(' + filenamePath.name + ')' + '(|__[0-9]+)' + '(' + filenamePath.ext + ')';
  var nameMatcher = new RegExp(pattern);

  function justTheseFiles (item) {
    return nameMatcher.test(item);
  }

  function index(filename_) {
    var index = 0;
    var filenamePath_ = pathParse(filename_);
    var lastIndexOfFilename = filenamePath_['name'].lastIndexOf(fileIndexSeparator);
    if (lastIndexOfFilename > 0){
      index = filename_.substring( (lastIndexOfFilename + fileIndexSeparator.length), (filename_.length - filenamePath_['ext'].length) );
      return parseInt(index,10);
    }
    return index;
  }

  function parsePath(filename) {
    return pathParse(filename);
  }

  function byIndex(a, b) {
    if (index(a) > index(b)) {
      return 1;
    } else if (index(a) < index(b)) {
      return -1;
    } else {
      return 0;
    }
  }

  function increaseFileIndex (fileToRename, cb) {
    var idx = index(fileToRename);
    debug('Index of ', fileToRename, ' is ', idx);
    if (idx < that.backups) {
      // Decorate filename.
      // filename__index.ext
      var parsedPath = pathParse(filename);
      var tempFilename = parsedPath['name'] + fileIndexSeparator + (idx + 1) + parsedPath['ext'];

      //on windows, you can get a EXIST error if you rename a file to an existing file
      //so, we'll try to delete the file we're renaming to first

      fs.unlink(path.join(path.dirname(filename), tempFilename), function (err) {
        //ignore err: if we could not delete, it's most likely that it doesn't exist
        debug('Renaming ', fileToRename, ' -> ', tempFilename);
        fs.rename(path.join(path.dirname(filename), fileToRename), path.join(path.dirname(filename), tempFilename), cb);
      });
    } else {
      cb();
    }
  }

  function renameTheFiles(cb) {
    //roll the backups (rename file__n to file__n+1, where n <= numBackups)
    debug("Renaming the old files");
    fs.readdir(path.dirname(filename), function (err, files) {
      async.forEachSeries(
        files.filter(justTheseFiles).sort(byIndex).reverse(),
        increaseFileIndex,
        cb
      );
    });
  }

  debug("Rolling, rolling, rolling");
  async.series([
    this.closeTheStream.bind(this),
    renameTheFiles,
    this.openTheStream.bind(this)
  ], callback);

};
