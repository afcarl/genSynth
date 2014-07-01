'use strict';

var path = require('path'),
    expressConfig = require('./config/expressConfig').config;

module.exports = function(grunt) {
  grunt.initConfig({
    config: {
      app: 'public',
      dist: 'dist'
    },
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      neuter: {
        files: ['<%= config.app %>/ember/{,*/}*.js'],
        tasks: ['neuter', 'replace:sourceMap']
      },
      serverTemplates: {
        files: ['server/views/**'],
        options: {
          livereload: true,
        }
      }
    },
    nodemon: {
      dev: {
        script: 'server.js'
      },
      options: {
        ignore: ['node_modules/**'],
      }
    },
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      tasks: ['nodemon', 'watch']
    },
    env: {
      test: {
        NODE_ENV: 'test'
      }
    },
    mochaTest: {
      src: ['test/**/*.js'],
      options: {
        reporter: 'spec',
        require: 'server.js'
      }
    }, 
    clean: {
      server: '.tmp'
    }

    jshint: {
      files: [
        'Gruntfile.js',
        'config/**/*.js',
        'src/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  //Load NPM tasks 
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-env');

  grunt.option('force', true);

  // Servers
  grunt.registerTask('default', [
      'clean:server',
      'replace:sourceMap',
      'concurrent'
  ]);

  grunt.registerTask('test', ['env:test', 'mochaTest']);
};