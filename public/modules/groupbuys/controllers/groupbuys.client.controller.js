'use strict';

// Groupbuys controller
angular.module('groupbuys').controller('GroupbuysController', ['$scope', '$stateParams', '$location', 'Authentication', 'Groupbuys',
	function($scope, $stateParams, $location, Authentication, Groupbuys) {
		$scope.authentication = Authentication;

		// Create new Groupbuy
		$scope.create = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				// Create new Groupbuy object
				var groupbuy = new Groupbuys ($scope.groupbuy);

				// Redirect after save
				groupbuy.$save(function(response) {
					$scope.success = true;
					$location.path('groupbuys/' + response.slug);

					// Clear form fields
					$scope.name = '';
				}, function(errorResponse) {
					$scope.error = errorResponse.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Remove existing Groupbuy
		$scope.remove = function(groupbuy) {
			if ( groupbuy ) {
				groupbuy.$remove();

				for (var i in $scope.groupbuys) {
					if ($scope.groupbuys [i] === groupbuy) {
						$scope.groupbuys.splice(i, 1);
					}
				}
			} else {
				$scope.groupbuy.$remove(function() {
					$location.path('groupbuys');
				});
			}
		};

		// Update existing Groupbuy
		$scope.update = function() {
			var groupbuy = $scope.groupbuy;

			groupbuy.$update(function() {
				$location.path('groupbuys/' + groupbuy.slug);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Groupbuys
		$scope.find = function() {
			$scope.groupbuys = Groupbuys.query();
		};

		// Find existing Groupbuy
		$scope.findOne = function() {
			$scope.groupbuy = Groupbuys.get({
				groupbuySlug: $stateParams.groupbuySlug
			});
		};
	}
]);
