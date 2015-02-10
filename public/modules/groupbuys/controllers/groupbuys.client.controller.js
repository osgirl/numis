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
angular.module('groupbuys').controller('GroupbuysController', ['$scope','Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
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
	* @name groupbuys.controller:GroupbuysController.$scope.loadList
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Gets the list of Groupbuys from the server and processes it.
	*/
	$scope.loadList = function(){
		var serverData = Restangular.all('groupbuys').getList();

		serverData.then(function(data) {

			// Add the real URL to the elements
			for (var i=0; i<data.length; i++) {
				data[i].restangularUrl = data[i].getRequestedUrl();
			}

			$scope.groupbuys = data;

		}, function errorCallback() {
	// TODO translate this key and don't use alert
			alert('Error getting data from server');
		});
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.create
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Create new Groupbuy and redirects to the manage page
	*/
	$scope.create = function(isValid) {
		if (isValid) {
			console.log('create-begin');

			var newGroupbuy = {};
			newGroupbuy.title = $scope.groupbuy.title;
			newGroupbuy.description = $scope.groupbuy.description;

			Restangular.all('groupbuys').post(newGroupbuy).then(function(serverResponse) {

			// Redirect after save
			// TODO parse and get Id
			//	$location.path('groupbuys/' + response._id + '/manage');

			}, function(serverResponse) {
				// TODO parse and show errors
				console.log("Error sending data to server");
			});
		}
	};


	// ----------------------
	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.loadOne
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Loads the groupbuy, userRole and tabs into the scope.
	*/
	$scope.loadOne = function() {

		var groupbuyData = Restangular.one('groupbuys',$stateParams.groupbuyId).get();

		groupbuyData.then(function(data) {
			$scope.groupbuy = data;
			/*
			// Load members
			console.log('load items');
			var membersData = Restangular.all('groupbuys',$stateParams.groupbuyId,'members').getList();

			membersData.then(function(data) {

				// Cargar los members

			}


			// Load items
			console.log('load members');
			var itemsData = Restangular.all('groupbuys',$stateParams.groupbuyId,'items').getList();

			itemsData.then(function(data) {

				// Cargar los items

			}
			*/

			$scope.userRole = $scope.userRole();
			$scope.loadTabs();

		}, function errorCallback() {
			// TODO translate this key and don't use alert
			alert('Error getting data from server');
		});


	};

// from the top of the file
}
]);
