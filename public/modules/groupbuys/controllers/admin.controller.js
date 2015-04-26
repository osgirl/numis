'use strict';

/**
* @ngdoc controller
* @name groupbuys.controller:AdminController
*
* @description
* Controlador encargado de la gestión de la administracion.
*/

// Groupbuys controller
angular.module('groupbuys').controller('AdminController', ['$scope','Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys', '$http',
function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys, $http) {
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

	/*
	@ngdoc method
	* @name groupbuys.controller:AdminController.findPosition
	* @methodOf groupbuys.controller:AdminController
	@description
	* Finds the first appearance of an element that cointains an _id property with the value provided.
	* Otherwise returns -1
	*/
	$scope.findPosition = function(value, list) {
		var position = -1;
		if (value !== '' && list !== '' ) {
			for (var i = 0 ; i < list.length ; i++){
				if (list[i]._id === value) {
					position = i;
					break;
				}
			}
		}
		return position;
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.loadAdminData
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Loads the groupbuy, userRole and tabs into the scope.
	*/
	$scope.loadAdminData = function() {
		$scope.loadAdminTabs();
		// - - - - - - - -
		// Load users data
		$scope.usersList = [];
		$scope.selectedAll = false;
		$scope.hideWriteArea = true;
		$scope.messageBody = '';
		$scope.showUserEditArea = false;

		Restangular.all('users').getList().then(function(data) {
			for (var i=0; i<data.length; i++) {
				// Get real data
				Restangular.one('users', data[i]._id).get().then(function(data) {

					var element = [];
					element._id = data._id;
					element.username = data.username;
					element.avatar = data._links.avatar.href;
					element.email = data.email;
					element.roles = data.roles;
					element.lastName = data.lastName;
					element.firstName = data.firstName;
					element.homeAddress = data.homeAddress;

					// Special flags for roles
					element.isAdmin = false;
					element.isUser = false;
					if (typeof element.roles !== 'undefined' && element.roles.indexOf('admin') !== -1 ) {
						element.isAdmin = true;
					}
					if (typeof element.roles !== 'undefined' && element.roles.indexOf('user') !== -1 ) {
						element.isUser = true;
					}

					$scope.usersList.push(element);

				}, function(serverResponse) {
					$scope.error = $translate.instant('core.Error_connecting_server');
				});
			}

			// - - - - - - - -
			// Load groupbuys data
			$scope.activeGroupbuys = [];
			$scope.oldGroupbuys = [];

			Restangular.all('groupbuys').getList().then(function(data) {
				for (var i=0; i<data.length; i++) {
					// Add managers
					data[i].managersList = [];
					for (var j=0; j<data[i].managers.length; j++) {
						var position = $scope.findPosition(data[i].managers[j], $scope.usersList);
						if (position !== -1) {
							data[i].managersList.push($scope.usersList[position].username);
						}
					}
					// Add members number
					data[i].membersLength = data[i].members.length;

					// Short it
					if (data[i].status === 'closed' || data[i].status === 'cancelled' || data[i].status === 'deleted' ) {
						$scope.oldGroupbuys.push(data[i]);
					} else {
						$scope.activeGroupbuys.push(data[i]);
					}

				}
			}, function(serverResponse) {
				$scope.error = $translate.instant('core.Error_connecting_server');
			});

			// --- end groupbuys

		}, function(serverResponse) {
			$scope.error = $translate.instant('core.Error_connecting_server');
		});
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.loadAdminTabs
	* @methodOf groupbuys.controller:AdminController
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
    // USERS TAB FUNCTIONS
	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.addAdmin
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.addAdmin = function(userId) {
		Restangular.one('users',userId).one('admin').put().then(function(data) {
			var position = $scope.findPosition(userId, $scope.usersList);
			if (position !== -1) {
				$scope.usersList[position].isAdmin = true;
			}
		}, function(serverResponse) {
			$scope.error = $translate.instant('core.Error_connecting_server');
		});
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.removeAdmin
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.removeAdmin = function(userId) {
		Restangular.one('users',userId).one('admin').remove().then(function(data) {
			var position = $scope.findPosition(userId, $scope.usersList);
			if (position !== -1) {
				$scope.usersList[position].isAdmin = false;
			}
		}, function(serverResponse) {
			$scope.error = $translate.instant('core.Error_connecting_server');
		});
	};

	// ----------------------
	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.changeState
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.showProfile = function(userId) {
		var position = $scope.findPosition(userId, $scope.usersList);
		if (position !== -1) {
			$scope.editingUser = $scope.usersList[position];
		}
		$scope.showUserEditArea = true;
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.changeState
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.disableUser = function(userId) {
		Restangular.one('users',userId).post('suspend').then(function(data) {
			var position = $scope.findPosition(userId, $scope.usersList);
			if (position !== -1) {
				$scope.usersList[position].isUser = false;
			}
		}, function(serverResponse) {
			$scope.error = $translate.instant('core.Error_connecting_server');
		});
	};

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.enableUser
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.enableUser = function(userId) {
		Restangular.one('users',userId).post('approve').then(function(data) {
			var position = $scope.findPosition(userId, $scope.usersList);
			if (position !== -1) {
				$scope.usersList[position].isUser = true;
			}
		}, function(serverResponse) {
			$scope.error = $translate.instant('core.Error_connecting_server');
		});
	};

	// ----------------------

	/**
    * @ngdoc method
    * @name groupbuys.controller:AdminController.$scope.changeState
    * @methodOf groupbuys.controller:AdminController
    *
    * @description
    * Changes the state of a Groupbuy.
    */
    $scope.showWriteArea = function() {
		$scope.hideWriteArea = false;
    };

    // ----------------------
    /**
    * @ngdoc method
    * @name groupbuys.controller:AdminController.$scope.changeState
    * @methodOf groupbuys.controller:AdminController
    *
    * @description
    * Changes the state of a Groupbuy.
    */
    $scope.sendMail = function() {
		$scope.hideWriteArea = true;
		angular.forEach($scope.usersList, function (user) {
			if(user.Selected === true){
				console.log('mail-to: ' + user.username);
				// TODO Send mail
				// USER DATA:
				// User: user.username
				// ID: user._id
				// Mail: user.email
				// Text: $scope.messageBody <-- In HTML format
			}
		});
    };

    // ----------------------

	/**
    * @ngdoc method
    * @name groupbuys.controller:AdminController.$scope.checkAll
    * @methodOf groupbuys.controller:AdminController
    *
    * @description
    * Checks all users.
    */
	$scope.checkAll = function () {
		$scope.selectedAll = !$scope.selectedAll;
		angular.forEach($scope.usersList, function (user) {
			user.Selected = $scope.selectedAll;
		});
	};

	// ----------------------
	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.saveEditedUser
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.saveEditedUser = function() {
        var payload = {};
        payload.username = $scope.editingUser.username;
        payload.email = $scope.editingUser.email;
        payload.homeAddress = $scope.editingUser.homeAddress;
// TODO FIX THIS!!!
		payload.firstName = $scope.editingUser.firstName;
		payload.lastName = $scope.editingUser.lastName;
		payload.displayName = payload.firstName + ' ' + payload.lastName;

        // Updating the server via API
        Restangular.one('users',$scope.editingUser._id).put(payload).then(function(data) {
			$scope.showUserEditArea = false;
			var position = $scope.findPosition($scope.editingUser._id, $scope.usersList);
			if (position !== -1) {
				$scope.usersList[position] = $scope.editingUser;
			}
        }, function(serverResponse) {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });
	};
	// ----------------------
	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.forgetEditedUser
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.forgetEditedUser = function() {
		$scope.showUserEditArea = false;
		$scope.editingUser = [];
	};

	// ----------------------
	/**
	* @ngdoc method
	* @name groupbuys.controller:AdminController.$scope.sendPasswdMail
	* @methodOf groupbuys.controller:AdminController
	*
	* @description
	* Changes the state of a Groupbuy.
	*/
	$scope.sendPasswdMail = function() {
		// TODO Use restangular here! (note: not /api/v1 restangular could be used)
		$scope.credentials = {
			username: $scope.editingUser.username
		};

		$http.post('/auth/forgot', $scope.credentials).success(function(response) {
			// Show user success message and clear form
			$scope.credentials = null;
			// TODO + NOTE: This don't work if there isn't a mail server configured

		}).error(function(response) {
			// Show user error message and clear form
			$scope.credentials = null;
		});

	};

	// ----------------------
	// GROUPBUYS TAB FUNCTIONS
	// ----------------------



// from the top of the file
}
]);
