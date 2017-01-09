const exec   = require('child_process').exec
const path   = require('path')

const rimraf      = require('rimraf')
const runSequence = require('run-sequence')

const gulp   = require('gulp')
const lambda = require('gulp-awslambda')
const zip    = require('gulp-zip')

gulp.task('deploy', (cb) => {
  return runSequence(
    'deploy.clean',
    'deploy.copy',
    'deploy.phantomjs',
    'deploy.zip',
    'deploy.upload',
    cb
  )
})

gulp.task('deploy.clean', (cb) => {
  rimraf('./dist', cb)
})

gulp.task('deploy.copy', () => {
  return gulp.src(['./**/*', '!./dist/**/*', '!archive.zip'])
    .pipe(gulp.dest('dist'))
})

gulp.task('deploy.phantomjs', (cb) => {
  const command = 'npm install phantomjs-prebuilt ' +
    '--phantomjs_cdnurl=http://cnpmjs.org/downloads'
  const cwd = path.join(__dirname, 'dist')
  const env = Object.assign({
    PHANTOMJS_PLATFORM: 'linux',
    PHANTOMJS_ARCH: 'x64',
  }, process.env)

  exec(command, { cwd, env }, (err, stdout, stderr) => {
    if (stdout) { process.stdout.write(stdout) }
    if (stderr) { process.stderr.write(stderr) }
    cb(err)
  })
})

gulp.task('deploy.zip', () => {
  return gulp.src(['./dist/**/*'])
    .pipe(zip('archive.zip'))
    .pipe(gulp.dest('.'))
})

gulp.task('deploy.upload', () => {
  return gulp.src(['./archive.zip'])
    .pipe(lambda('Shinku', { region: 'ap-northeast-1' }))
    .pipe(gulp.dest('.'))
})
