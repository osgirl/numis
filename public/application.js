'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

// Add i18n to application from locales files
angular.module(ApplicationConfiguration.applicationModuleName).config(['$translateProvider',
	function($translateProvider) {
		// Translate
		$translateProvider
		.useStaticFilesLoader({
			prefix: 'locales/locale-',
			suffix: '.json'
		})
		.registerAvailableLanguageKeys(['en', 'es'], {
			'en-*': 'en',
			'es-*': 'es'
		})
		.determinePreferredLanguage(function () {
			//return document.documentElement.getAttribute('lang');
			return 'es';
		})
		.fallbackLanguage('en');
	}
]);

// Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);

	// Prevent drop files in body
//	angular.element(document).attr('flow-prevent-drop', '');
});

// Configure restangular
angular.module(ApplicationConfiguration.applicationModuleName).config(['RestangularProvider',

	function(RestangularProvider) {

		// Configure values:

		// Endopoint
		RestangularProvider.setBaseUrl('http://localhost:3000/api/v1/');

		RestangularProvider.setDefaultHeaders(
			{ 'Content-Type': 'application/json' }
		);

		// set only for get method (for pagination)
		/*Restangular.setDefaultRequestParams(
			'get', {limit: 10}
		);*/

		// Add a response intereceptor to extract the JSON from the response Object
		RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {

/*
			// debug:
			console.log("````````````````");
			console.log(' -- data -- ');
			console.log(data);
			console.log(' -- operation -- ');
			console.log(operation);
			console.log(' -- what -- ');
			console.log(what);
			console.log(' -- url -- ');
			console.log(url);
			console.log(' -- response -- ');
			console.log(response);
			console.log(' -- deferred -- ');
			console.log(deferred);
			console.log("````````````````");


*/

			if (operation === 'getList') {

				var resp = data._embedded[what];
				resp._links = data._links;
			    return resp;

			}

			return data;
		});


		// Parse elements
		RestangularProvider.setRestangularFields({
			id: '_id'
		});
		RestangularProvider.setRestangularFields({
			selfLink: 'self.link'
		});

	}
]);
