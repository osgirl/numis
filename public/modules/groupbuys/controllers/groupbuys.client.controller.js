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
				console.log('Error sending data to server');
			});
		}
	};


	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.update
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Update existing Groupbuy
	*/
	$scope.update = function() {
		$scope.groupbuy.save();
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

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.userRole
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Return the role ('manager', 'member', 'none') of the user in the groupbuy according to the url provided.
	*/
	$scope.userRole = function() {
		var role = 'none';
		var manage = false;

		if ($scope.authentication && $scope.authentication.user) {
			var userId  = $scope.authentication.user._id;
			var fullUrl = $location.path().split('/');

			if (fullUrl[fullUrl.length - 1] === 'manage') {
				manage = true;
			}

			if ( $scope.groupbuy.members.length > 0 && $scope.groupbuy.members.indexOf(userId) !== -1 ) {
				role = 'member';
			}

			if ($scope.groupbuy.managers.length > 0 && $scope.groupbuy.managers.indexOf(userId) !== -1 ) {

				if (manage) {
					role = 'manager';
					$scope.authentication.user.memberCanAdmin = false;
				} else {
					// If it's manager but it's in member mode, set $scope.authentication.user.canAdmin to true
					$scope.authentication.user.memberCanAdmin = true;
				}

			}

			return role;
		} else {
			return null;
		}

	//	return 'none';
    //	return 'member';
	//	return 'manager';
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
	$scope.loadTabs =  function() {
		// Create the tabs menu according to the permissions of the user:
		$translate([
			'groupbuys.Information',
			'groupbuys.Items',
			'groupbuys.Buyers',
			'groupbuys.Requests',
			'groupbuys.Requests_summary',
			'groupbuys.Messaging',
			'groupbuys.Payments',
			'groupbuys.Deliveries',
			'groupbuys.Managers',
			'groupbuys.Configuration'
			]).then(function (translations) {
				switch ( $scope.userRole ){
					case 'manager':
						$scope.tabs = [
							{
								title: translations['groupbuys.Information'],
								template: '/modules/groupbuys/views/tabs/info-groupbuy.client.view.html',
								active: true
							},{
								title: translations['groupbuys.Items'],
								template:'/modules/groupbuys/views/tabs/items-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Buyers'],
								template:'/modules/groupbuys/views/tabs/buyers-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Requests'],
								template:'/modules/groupbuys/views/tabs/requests-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Requests_summary'],
								template:'/modules/groupbuys/views/tabs/requests-summary-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Messaging'],
								template:'/modules/groupbuys/views/tabs/messaging-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Payments'],
								template:'/modules/groupbuys/views/tabs/payments-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Deliveries'],
								template:'/modules/groupbuys/views/tabs/deliveries-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Managers'],
								template:'/modules/groupbuys/views/tabs/managers-groupbuy.client.view.html'
							},{
								title: translations['groupbuys.Configuration'],
								template:'/modules/groupbuys/views/tabs/config-groupbuy.client.view.html'
							}
						];
						break;
						case 'member':
							$scope.tabs = [
								{
									title: translations['groupbuys.Information'],
									template: '/modules/groupbuys/views/tabs/info-groupbuy.client.view.html',
									active: true
								},{
									title: translations['groupbuys.Items'],
									template:'/modules/groupbuys/views/tabs/items-groupbuy.client.view.html'
								},{
									title: translations['groupbuys.Buyers'],
									template:'/modules/groupbuys/views/tabs/buyers-groupbuy.client.view.html'
								},{
									title: translations['groupbuys.Messaging'],
									template:'/modules/groupbuys/views/tabs/messaging-groupbuy.client.view.html'
								},{
									title: translations['groupbuys.Payments'],
									template:'/modules/groupbuys/views/tabs/payments-groupbuy.client.view.html'
								},{
									title: translations['groupbuys.Deliveries'],
									template:'/modules/groupbuys/views/tabs/deliveries-groupbuy.client.view.html'
								},{
									title: translations['groupbuys.Managers'],
									template:'/modules/groupbuys/views/tabs/managers-groupbuy.client.view.html'
								}
							];
							break;
							default:
								$scope.tabs = [
								{
									title: translations['groupbuys.Information'],
									template: '/modules/groupbuys/views/tabs/info-groupbuy.client.view.html',
									active: true
								},{
									title: translations['groupbuys.Items'],
									template:'/modules/groupbuys/views/tabs/items-groupbuy.client.view.html'
								},{
									title: translations['groupbuys.Managers'],
									template:'/modules/groupbuys/views/tabs/managers-groupbuy.client.view.html'
								}
								];
								break;
				}
			});
	};


	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.toogleManage
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Toogles the manage or memeber view
	*/
	$scope.toogleManage = function() {
		var fullUrl = $location.path().split('/');
		if (fullUrl[fullUrl.length - 1] === 'manage') {
			// From manager to member
			$location.path('groupbuys/' + $scope.groupbuy._id );
		} else {
			// From member to manager
			$location.path('groupbuys/' + $scope.groupbuy._id + '/manage');

		}
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.remove
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Remove existing Groupbuy
	*/
	$scope.remove = function(groupbuy) {
			$scope.groupbuy.remove().then(function () {
				$location.path('groupbuys');
			});
	};

	// ----------------------


// from the top of the file
}
]);
