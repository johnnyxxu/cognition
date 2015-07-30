var gulp = require('gulp'),
    insert = require('gulp-insert'),
    exec = require('child_process').exec,
    //shell = require('gulp-shell'),
    path = require('path')
    bsDir = path.join(__dirname, 'node_modules', 'bootstrap');

//gulp.task('install-bootstrap', function(cb) {
  //run('npm install', {cwd: bsDir}, cb);
//}

function run(command, options, cb) {
  cb = cb || options;
  exec(command, function(err, stdout, stderr) {
    if (err)
      return cb(err);
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    cb();
  });
}

gulp.task('edit', function() {
  return gulp.src(path.join(bsDir, 'less', 'variables.less'))
    .pipe(insert.append('\n/* woooop */\n'))
    .pipe(gulp.dest(path.join(bsDir, 'less')))
});

gulp.task('one', function(cb) {
  run('sleep 1; echo one', cb);
});

gulp.task('two', ['one'], function(cb) {
  run('echo two', cb);
});

gulp.task('default', ['two']);
