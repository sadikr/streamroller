streamroller
============


Node.js file streams that roll over when they reach a maximum size, or a date/time.

        npm install streamroller

## usage

        var rollers = require('streamroller');
        var stream = new rollers.RollingFileStream('myfile', 1024, 3);
        stream.write("stuff");
        stream.end();

The streams behave the same as standard node.js streams, except that when certain conditions are met they will rename the current file to a backup and start writing to a new file. 

### new RollingFileStream(filename, maxSize, numBackups, options)
* `filename` (String)
* `maxSize` - the size in bytes to trigger a rollover
* `numBackups` - the number of old files to keep
* `options` - Object
  * `encoding` - defaults to 'utf8'
  * `mode` - defaults to 0644
  * `flags` - defaults to 'a'

This returns a `WritableStream`. When the current file being written to (given by `filename`) gets up to or larger than `maxSize`, then the current file will be renamed to `filename__1.ext` and a new file will start being written to. Up to `numBackups` of old files are maintained, so if `numBackups` is 3 then there will be 4 files:
<pre>
     filename.ext
     filename__1.ext
     filename__2.ext
     filename__3.ext
</pre>
When filename size >= maxSize then:
<pre>
     filename.ext -> filename__1.ext
     filename__1.ext -> filename__2.ext
     filename__2.ext -> filename__3.ext
     filename__3.ext gets overwritten
     filename.ext is a new file
</pre>

### TODO
=========
1. Tests cases are failing. 

### new DateRollingFileStream(filename, pattern, options)
* `filename` (String)
* `pattern` (String) - the date pattern to trigger rolling (see below)
* `options` - Object
	* `encoding` - defaults to 'utf8'
	* `mode` defaults to 0644
	* `flags` defaults to 'a'
	* `alwaysIncludePattern` - (boolean) extend the initial file with the pattern, defaults to false
	
This returns a `WritableStream`. When the current time, formatted as `pattern`, changes then the current file will be renamed to `filename.formattedDate` where `formattedDate` is the result of processing the date through the pattern, and a new file will begin to be written. Streamroller uses [date-format](http://github.com/nomiddlename/date-format) to format dates, and the `pattern` should use the date-format format. e.g. with a `pattern` of `"yyyy-MM-dd"`, and assuming today is August 29, 2013 then writing to the stream today will just write to `filename`. At midnight, `filename` will be renamed to `filename.2013-08-29` and a new `filename` will be created. If `options.alwaysIncludePattern` is true, then the initial file will be `filename.2013-08-29` and no renaming will occur at midnight, but a new file will be written to with the name `filename.2013-08-30`.
 
