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
			alert("Error getting data from server");
		});
	};

// from the top of the file
}
]);
