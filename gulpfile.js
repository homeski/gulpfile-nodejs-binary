var fs = require('fs-extra');
var fstream = require("fstream");
var gulp = require('gulp');
var tar = require('tar');
var zlib = require('zlib');

// config variables
var tmpDir = '/tmp/gulp/repo';
var targetDir = './target';
var destTarball = targetDir + '/repo.tar.gz';

// create the needed directories
gulp.task('mkdirs', function() {
	fs.removeSync(tmpDir);
	fs.mkdirsSync(tmpDir);
	fs.mkdirsSync(targetDir);
});

// copy project files to temp folder
gulp.task('cp', ['mkdirs'], function() {
	return gulp.src(['**/*', '.*/**', '!.git/**', '!target/**'])
		.pipe(gulp.dest(tmpDir))
});

// tar files from temp folder
gulp.task('tarball', ['cp'], function() {
	var packer = tar.Pack({ noProprietary: true })
		.on('error', onError);

	var ws = fs.createWriteStream(destTarball);

	return fstream.Reader({ path: tmpDir, type: "Directory", filter: fixDirPerm })
		.on('error', onError)
		.pipe(packer)
		.pipe(zlib.createGzip())
		.pipe(ws);
});

// cleanup the created mess
gulp.task('clean', ['tarball'], function() {
	return fs.remove(tmpDir);
});

// default task
// gc is dependent on all previous jobs
gulp.task('default', ['clean']);

function onError(err) {
  console.error('An error occurred:', err)
}

// By default Windows directories aren't executable.
// This may cause problems in linux + openshift
// https://github.com/npm/node-tar/issues/7
function fixDirPerm(entry) {
	// make sure readable directories have execute permission
	if (entry.props.type === "Directory") {
		entry.props.mode |= (entry.props.mode >>> 2) & 0111;
	}

	return true;
}