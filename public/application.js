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
	angular.element(document).attr('flow-prevent-drop', '');
});