var gulp = require('gulp');
var karma = require('karma').server;
var spawn = require('child_process').spawn;
var webserver = require('gulp-webserver');
var jshint = require('gulp-jshint');

gulp.task('lint', function() {
  return gulp.src([
      './client/*.js',
      './client/components/**/*.js',
      './client/org/**/*.js',
      './client/login/**/*.js',
      '!./client/lovefield.min.js',
      '!./client/karma.conf.js',
      '!./client/no-deps.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('webserver', function() {
  gulp.src('client')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

gulp.task('autotest:client', function() {
  karma.start({
    configFile: __dirname + '/client/karma.conf.js',
    singleRun: false
  });
});

gulp.task('test:client', ['lint'], function() {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  });
});

gulp.task('generatedb', function(done) {
  var lovefieldSpac = spawn('lovefield-spac', [
    '--schema',
    'lovefield/github.yml',
    '--namespace',
    'github.db',
    '--outputdir',
    'client/db'
  ]);

  lovefieldSpac.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  lovefieldSpac.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
    console.log('This is probably because lovefield-spac is not installed');
    console.log('See: https://github.com/google/lovefield/blob/master/docs/quick_start.md')
  });

  lovefieldSpac.on('close', function (code) {
    console.log('child process exited with code ' + code);
    done()
  });
});

gulp.task('default', ['generatedb', 'webserver']);
