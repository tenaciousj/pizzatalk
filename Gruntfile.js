module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    aws: grunt.file.readJSON('aws-credentials.json'),
    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: "pizza-files",
        gzip: false
      },
      dist: {
        src: "dist.zip"
      }
    },
    compress: {
      dist: {
        options: {
          archive: "dist.zip",
          mode: "zip"
        },
        files: [{
          expand: true,
          src: [
              'index.js',
              'node_modules/**'
            ]
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-beep');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['compress:dist', 's3:dist', 'beep:2']);
};