module.exports = function (grunt) {  
  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);  
    
  // Project configuration.  
  grunt.initConfig({  
    pkg: grunt.file.readJSON('package.json'),
    express: {
      all: {
        options: {
          port: 9000,
          hostname: 'localhost',
          bases: ['.'],
          livereload: true
        }
      }
    },   
    jshint: {
      files: ['Gruntfile.js', 'js/app.js'],
      options: {
        reporter: require('jshint-stylish'),
        force: true,
        globals: {
          jQuery: true
        } 
      }
    },
    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'scss/styles.css': 'scss/styles.scss'
        }
      }
    },
    cssmin: {  
      sitecss: {  
        options: {  
          banner: '/* Mercantes-del-Karibe minified css file */'  
        },  
        files: {  
          'css/common.min.css': [
          'bower_components/bootstrap/dist/css/bootstrap.min.css',
          'scss/styles.css'
          ]  
        }  
      }  
    },  
    uglify: {  
      options: {  
        compress: true  
      },  
      applib: {  
        src: [  
        'bower_components/jquery/dist/jquery.min.js',  
        'bower_components/phaser/build/phaser.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js'
        ],  
        dest: 'js/common.js'  
      }  
    },
    watch: {
      js: {
        files: ['js/*.js'],
        tasks: ['jshint']
      },
      css: {
        files: ['scss/*.scss'],
        tasks: ['sass', 'cssmin']
      },
      options: {
        livereload: true,
      }
    }
  });  
  // Default task.  
  grunt.registerTask('default', ['jshint', 'sass','uglify', 'cssmin']);
  grunt.registerTask('server', ['express', 'watch']);
};