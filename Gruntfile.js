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
    },
    rename: {
      start1: {
        files: [{
          src: ['node_modules'],
          dest: ['fake_node_modules']
        }]
      },
      start2: {
        files: [{
          src: ['real_node_modules'],
          dest: ['node_modules']
        }]
      },
      end1: {
          src: ['node_modules'],
          dest: ['real_node_modules']
      },
      end2: {
          src: ['fake_node_modules'],
          dest: ['node_modules']
      }
    }
  });

  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-beep');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['rename:start1', 'rename:start2', 'compress:dist', 's3:dist', 'beep:2', 'rename:end1', 'rename:end2']);
};