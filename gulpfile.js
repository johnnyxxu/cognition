var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    rm = require('rimraf'),
    stat = require('fs').stat,
    spawn = require('child_process').spawn;

var theme = 'superhero',
    buildDir = './web/build/',
    outDir = './web/serve/resources/',
    spawnOpts = {
      cwd: buildDir,
      stdio: 'inherit'
    };

gulp.task('clean', function(cb) {
  rm(buildDir, cb);
});

gulp.task('prepare-bw', function(cb) {
  // don't bother copying if buildDir already exists
  stat(buildDir, function(err) {
    if (err) {
      return gulp.src('./node_modules/bootswatch/**')
        .pipe(gulp.dest(buildDir));
    } else {
      console.log('skipping since '+buildDir+' already exists');
      cb();
    }
  });
});

gulp.task('install-bw', ['prepare-bw'], function(cb) {
  // don't bother with npm install if buildDir/node_modules already exists
  stat(buildDir + 'node_modules', function(err) {
    if (err) {
      spawn('npm', ['install'], spawnOpts)
        .on('error', cb)
        .on('close', function(code) {
          cb( (code !== 0) ? new Error('npm install failed') : null );
        });
    } else {
      console.log('skipping since '+buildDir+'node_modules already exists');
      cb();
    }
  });
});

gulp.task('customize-bw-vars', ['install-bw'], function() {
  return gulp.src([
        './node_modules/bootswatch/' + theme +'/variables.less',
        './web/variables.less'
    ])
    .pipe(concat('variables.less'))
    .pipe(gulp.dest(buildDir + theme));
});

gulp.task('build-bw', ['customize-bw-vars'], function(cb) {
  spawn(__dirname+'/node_modules/.bin/grunt', ['swatch:'+theme], spawnOpts)
    .on('error', cb)
    .on('close', function(code) {
      cb( (code !== 0) ? new Error('grunt swatch:'+theme+' failed') : null );
    });
});

gulp.task('copy-bw-css', ['build-bw'], function() {
  return gulp.src(buildDir + theme + '/*.css')
    .pipe(rename({prefix: 'custom-'}))
    .pipe(gulp.dest(outDir));
});

gulp.task('bw', [
  'prepare-bw',
  'install-bw',
  'customize-bw-vars',
  'build-bw',
  'copy-bw-css'
]);

gulp.task('styles', function() {
  //return gulp.src('./web/styles.less')
    //.pipe()
})

gulp.task('default', ['bw'])


//gulp.task('build', function(cb) {
//
  //var log = function(msg) {
    //console.log('build: ' + msg);
  //}
//
  //log('populating ' + buildDir);
//
  ////rm.sync(buildDir + theme + '/bootswatch.less');
  //try {
    //exec('ls superhero', execOpts);
  //} catch (e) {
    //return cb(e);
  //}
  //var l = lstat(buildDir + theme + '/variables.less');
  //console.log(l);
//
  //return cb();
//
  //// npm install in build dir
  //// Don't bother if node_modules already exists
  //// lstatSync throws if file doesn't exist
  //try {
    //lstat(buildDir + 'node_modules');
    //log(buildDir+'node_modules already exists; skipping npm install');
  //} catch (e) {
    //try {
      //log('running npm install in ' + execOpts.cwd);
      //exec('npm install', execOpts);
    //} catch (e) {
      //return cb(e);
    //}
  //}
//
  //log('concatenating custom less and bootswatch less files');
//
  ////log('rebuilding bootswatch ' + theme + ' theme');
  ////var cmd = __dirname+'/node_modules/.bin/grunt swatch:' + theme;
  ////exec(cmd, execOpts);
////
  ////log('copying and renaming resulting css files to ' + outDir);
//
  //cb();
//});
//
//gulp.task('default', ['build']);

//// copy bootswatch from node_modules to web/build
//gulp.task('copy-bootswatch', function() {
  //return gulp.src('./node_modules/bootswatch/**')
    //.pipe(gulp.dest('./web/build/bootswatch/'));
//});
//
//// run npm install in build/bootswatch
//gulp.task('install', ['copy-bootswatch'], function(cb) {
  //var root = './web/build/bootswatch/';
  //// don't need to npm install if node_modules already exists
  //fs.lstat(root+'node_modules', function(err, stats) {
    //if (err || !stats.isDirectory()) {
      //run('npm install', {cwd: root}, cb);
    //} else {
      //console.log(root+'node_modules already exists; skipping install');
      //cb();
    //}
  //});
//});
//
//// concat custom less and bootswatch less files
//gulp.task('concat', ['install'], function() {
  //var src = './node_modules/bootswatch/superhero/',
      //dest = './web/build/bootswatch/superhero/';
//
  //gulp.src([src+'variables.less', './web/variables.less'])
    //.pipe(concat('variables.less'))
    //.pipe(gulp.dest(dest));
//
  //return gulp.src([src+'bootswatch.less', './web/styles.less'])
    //.pipe(concat('bootswatch.less'))
    //.pipe(gulp.dest(dest));
//});
//
//gulp.task('build', ['concat'], function(cb) {
  //var cmd = __dirname+'/node_modules/.bin/grunt swatch:superhero';
  //run(cmd, {cwd:'./web/build/bootswatch'}, cb);
//});
//
//gulp.task('copy-css', ['build'], function() {
  //return gulp.src('./web/build/bootswatch/superhero/bootstrap.min.css')
    //.pipe(gulp.dest('./web/public/resources/'));
//});
//
//gulp.task('default', ['build']);
//
//function run(command, options, cb) {
  //options.PATH = __dirname+'/node_modules/.bin:'+process.env.PATH;
  //exec(command, options, function(err, stdout, stderr) {
    //if (err)
      //return cb(err);
    //process.stdout.write(stdout);
    //process.stderr.write(stderr);
    //cb();
  //});
//}
//
