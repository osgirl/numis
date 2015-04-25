'use strict';

/**
* @ngdoc controller
* @name groupbuys.controller:GroupbuysController
*
* @requires $cope
* @requires $stateParams
* @requires $location
* @requires $translate
* @requires users.service:Authentication
* @requires users.service:Groupbuys
*
* @description
* Controlador encargado de la gestión de las Compras en Grupo.
*/

// Groupbuys controller
angular.module('groupbuys').controller('AdminController', ['$scope','Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
	$scope.authentication = Authentication;

	//$locationProvider.html5Mode(true); // Mode HTML5

	// Configuration of tinyMCE
	$scope.tinymceOptions = {
		resize: false,
		menubar: false,
		statusbar: false,
		plugins: 'textcolor image table',
		toolbar1: 'bold italic underline strikethrough | forecolor backcolor fontsizeselect | removeformat',
		toolbar2: 'alignleft aligncenter alignright | bullist numlist outdent indent | table image'
	};


	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.loadOne
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Loads the groupbuy, userRole and tabs into the scope.
	*/
	$scope.loadAdminData = function() {


		$scope.loadAdminTabs();

		/*
		var groupbuyData = Restangular.one('groupbuys',$stateParams.groupbuyId).get();

		groupbuyData.then(function(data) {
			$scope.groupbuy = data;

			$scope.userRole = $scope.userRole();

			$scope.loadTabs();

			$scope.loadConfig();

		}, function errorCallback() {
			// TODO translate this key and don't use alert
			alert('Error getting data from server');
		});
*/

	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.loadTabs
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Loads the proper tabs in the scope based on the role of the user
	*/
	$scope.loadAdminTabs =  function() {
		// Create the tabs menu according to the permissions of the user:


		$scope.tabs = [
		{
			title: 'Usuarios',
			template:'/modules/groupbuys/views/admin/tabs/users.admin.view.html'
		},{
			title: 'Compras en grupo',
			template:'/modules/groupbuys/views/admin/tabs/groupbuys.admin.view.html'
		}
		];


	};


	// ----------------------



// from the top of the file
}
]);
