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
    shell: {
        options: {
            stderr: false
        },
        dist: 'jar uvf dist.zip index.js'
    }
  });

  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-beep');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['shell:dist', 's3:dist', 'beep:2']);
};