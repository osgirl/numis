'use strict';

module.exports = function(grunt) {
	// Unified Watch Object
	var watchFiles = {
		serverViews: ['app/views/**/*.*'],
		serverJS: 	 ['gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js'],
		appServerJS: ['app/**/*.js', '!'],
		clientViews: ['public/modules/**/views/**/*.html'],
		clientJS: 	 ['public/*.js', 'public/modules/**/*.js'],
		clientCSS: 	 ['public/modules/**/*.css'],
		mochaTests:  ['app/tests/**/*.js']
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			serverViews: {
				files: watchFiles.serverViews,
				options: {
					livereload: true
				}
			},
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			clientViews: {
				files: watchFiles.clientViews,
				options: {
					livereload: true,
				}
			},
			clientJS: {
				files: watchFiles.clientJS,
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			clientCSS: {
				files: watchFiles.clientCSS,
				tasks: ['csslint'],
				options: {
					livereload: true
				}
			}
		},
		jshint: {
			all: {
				src: watchFiles.clientJS.concat(watchFiles.serverJS),
				options: {
					jshintrc: true
				}
			}
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc',
			},
			all: {
				src: watchFiles.clientCSS
			}
		},
		uglify: {
			production: {
				options: {
					mangle: false
				},
				files: {
					'public/dist/application.min.js': 'public/dist/application.js'
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/dist/application.min.css': '<%= applicationCSSFiles %>'
				}
			}
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					nodeArgs: ['--debug'],
					ext: 'js,html',
					watch: watchFiles.serverViews.concat(watchFiles.serverJS)
				}
			}
		},
		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		ngAnnotate: {
			production: {
				files: {
					'public/dist/application.js': '<%= applicationJavaScriptFiles %>'
				}
			}
		},
		concurrent: {
			default: ['nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true,
				limit: 10
			}
		},
		env: {
			test: {
				NODE_ENV: 'test'
			},
			secure: {
				NODE_ENV: 'secure'
			}
		},
		mochaTest: {
			src: watchFiles.mochaTests,
			options: {
				reporter: 'spec',
				require: 'server.js'
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		},
		'merge-json': {
			en: {
				src: [ 'public/modules/**/locale-en.json', 'public/js/locale-en.json' ],
				dest: 'public/locales/locale-en.json'
			},
			es: {
				src: [ 'public/modules/**/locale-es.json', 'public/js/locale-es.json' ],
				dest: 'public/locales/locale-es.json'
			}
		},
		clean: {
			locales: {
				src: 'public/locales'
			},
			build: {
				src: 'public/dist'
			},
			docs: {
				src: ['public/docs', 'public/report']
			}
		},
		ngdocs: {
			options: {
				dest: 'public/docs',
				scripts: ['angular.js'],
				html5Mode: true,
				startPage: '/client',
				title: 'Documentación',
				bestMatch: true,
			},
			server: {
				src: watchFiles.appServerJS,
				title: 'Servidor',
				api: true
			},
			client: {
				src: watchFiles.clientJS,
				title: 'Cliente',
				api: true
			}
		},
		'license-report': {
			target: './public/docs/licenses.html'
		}
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var init = require('./config/init')();
		var config = require('./config/config');

		grunt.config.set('applicationJavaScriptFiles', config.assets.js);
		grunt.config.set('applicationCSSFiles', config.assets.css);
	});

	// Default task(s).
	grunt.registerTask('default', ['lint', 'locales', 'concurrent:default']);

	// Documentation task(s).
	grunt.registerTask('docs', ['clean:docs', 'ngdocs']);
	//grunt.registerTask('docs', ['clean:docs', 'ngdocs', 'license-report']);

	// Create locales task(s)
	grunt.registerTask('locales', ['clean:locales', 'merge-json']);

	// Debug task.
	grunt.registerTask('debug', ['lint', 'locales', 'concurrent:debug']);

	// Secure task(s).
	grunt.registerTask('secure', ['env:secure', 'lint', 'concurrent:default']);

	// Lint task(s).
	grunt.registerTask('lint', ['jshint', 'csslint']);

	// Build task(s).
	grunt.registerTask('build', ['lint', 'locales', 'loadConfig', 'ngAnnotate', 'uglify', 'cssmin']);

	// Test tasks.
	grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);
	grunt.registerTask('test-server', ['env:test', 'mochaTest']);
	grunt.registerTask('test-client', ['env:test', 'karma:unit']);

};