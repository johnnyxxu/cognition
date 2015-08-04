var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    less = require('gulp-less'),
    rm = require('rimraf'),
    async = require('async'),
    stat = require('fs').stat,
    spawn = require('child_process').spawn;

var outDir = './web/serve/resources/';


gulp.task('clean', function(cb) {
  rm(buildDir, cb);
});


// Create custom bootstrap/bootswatch css.
// This task is somewhat complex because boostrap doesn't really make it easy
// to modify less variables without modifying the files included in the lib.
// This task:
// 1 copies the bootswatch lib from node_modules to a build dir
// 2 runs npm install in build dir so that the bw grunt build task can be run
// 3 appends custom variables.less with bootswatch's variables.less
// 4 runs the grunt build to create the custom css
// 5 copies the resulting css to the output dir
gulp.task('bw', function(callback) {

  var theme = 'superhero',
      buildDir = './web/build/',
      spawnOpts = {
        cwd: buildDir,
        stdio: 'inherit'
      };

  var log = function(msg) {
    console.log('bw: ' + msg + '\n');
  };

  async.series([

    function(cb) {
      // don't bother copying if buildDir already exists
      stat(buildDir, function(err) {
        if (err) {
          log('copying bootswatch from node_modules to '+buildDir);
          gulp.src('./node_modules/bootswatch/**')
            .pipe(gulp.dest(buildDir))
            .on('error', cb)
            .on('end', cb);
        } else {
          log('skipping bootswatch copy; '+buildDir+' already exists');
          cb();
        }
      });
    },

    function(cb) {
      // don't bother doing npm install if buildDir/node_modules already exists
      stat(buildDir + 'node_modules', function(err) {
        if (err) {
          log('npm install in '+buildDir+' so bootswatch build can be run');
          spawn('npm', ['install'], spawnOpts)
            .on('error', cb)
            .on('close', function(code) {
              cb( (code !== 0) ? new Error('npm install failed') : null );
            });
          log('\n');
        } else {
          log('skipping npm install; '+buildDir+'node_modules already exists');
          cb();
        }
      });
    },

    function(cb) {
      var srcA = './node_modules/bootswatch/' + theme +'/variables.less',
          srcB = './web/variables.less',
          dest = buildDir + theme;
      log('concat '+srcA+' + '+srcB+' into '+dest);
      gulp.src([srcA, srcB])
        .pipe(concat('variables.less'))
        .pipe(gulp.dest(dest))
        .on('error', cb)
        .on('end', cb);
    },

    function(cb) {
      var cmd = __dirname+'/node_modules/.bin/grunt',
          arg = 'swatch:'+theme;
      log('running command: ' + cmd + ' ' + arg);
      spawn(cmd, [arg], spawnOpts)
        .on('error', cb)
        .on('close', function(code) {
          cb( (code !== 0) ? new Error(cmd+' '+arg+' failed') : null );
        });
    },

    function(cb) {
      var src = buildDir + theme + '/*.css';
      log('copying '+src+' to '+outDir);
      gulp.src(src)
        .pipe(rename({prefix: 'custom-'}))
        .pipe(gulp.dest(outDir))
        .on('error', cb)
        .on('end', cb);
    }

  ], callback);
});

gulp.task('styles', function() {
  return gulp.src('./web/styles.less')
    .pipe(less())
    .pipe(gulp.dest(outDir));
});

gulp.task('default', ['bw', 'styles']);

