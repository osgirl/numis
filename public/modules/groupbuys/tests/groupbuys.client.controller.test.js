'use strict';

(function() {
	// Groupbuys Controller Spec
	describe('Groupbuys Controller Tests', function() {
		// Initialize global variables
		var AuthenticationController,
			GroupbuysController,
			GroupbuysTabInfoController,
			scope,
			$httpBackend,
			$stateParams,
			$location;

		// The $resource service augments the response object with methods for updating and deleting the resource.
		// If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
		// the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
		// When the toEqualData matcher compares two objects, it takes only object properties into
		// account and ignores methods.
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Then we can start by loading the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName, function ($provide, $translateProvider) {

			// Prevent XHR callfor locale files
			$provide.factory('customLoader', function ($q) {
				return function () {
					var deferred = $q.defer();
					deferred.resolve({});
					return deferred.promise;
				};
			});

			$translateProvider.useLoader('customLoader');

			// Another option would be to always provide the preferred language
			// $translateProvider.translations('en', {});
		}));

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;

			// Initialize the Groupbuys controller.
			GroupbuysController = $controller('GroupbuysController', {
				$scope: scope
			});

			// Initialize the Authentication controller
			AuthenticationController = $controller('AuthenticationController', {
				$scope: scope
			});

			// Initialize the tabs controllers
			GroupbuysTabInfoController = $controller('GroupbuysTabInfoController', {
				$scope: scope
			});

		}));

		it('$scope.find() should create an array with at least one Groupbuy object fetched from XHR', inject(function(Groupbuys) {
			// Create sample Groupbuy using the Groupbuys service
			var sampleGroupbuy = new Groupbuys({
				name: 'New Groupbuy'
			});

			// Create a sample Groupbuys array that includes the new Groupbuy
			var sampleGroupbuys = [sampleGroupbuy];

			// Set GET response
			$httpBackend.expectGET('groupbuys').respond(sampleGroupbuys);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.groupbuys).toEqualData(sampleGroupbuys);
		}));

		it('$scope.findOne() should create an array with one Groupbuy object fetched from XHR using a groupbuyId URL parameter', inject(function(Groupbuys) {
			// Define a sample Groupbuy object
			var sampleGroupbuy = new Groupbuys({
				name: 'New Groupbuy',
				description: 'This is a new groupbuy'
			});

			// Set the URL parameter
			//$stateParams.groupbuyId = '525a8422f6d0f87f0e407a33';
			$stateParams.groupbuySlug = 'new-groupbuy';

			// Set GET response
			$httpBackend.expectGET(/groupbuys\/([0-9a-z\-]{10,80})$/).respond(sampleGroupbuy);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.groupbuy).toEqualData(sampleGroupbuy);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Groupbuys) {
			// Login
			$httpBackend.when('POST', '/auth/signin').respond(200, 'Fred');
			scope.signin();
			$httpBackend.flush();

			// Create a sample Groupbuy object
			var sampleGroupbuyPostData = new Groupbuys({
				name: 'New Groupbuy',
				description: 'This is a new groupbuy'
			});

			// Create a sample Groupbuy response
			var sampleGroupbuyResponse = new Groupbuys({
				_id: '525cf20451979dea2c000001',
				name: 'New Groupbuy',
				slug: 'new-groupbuy',
				description: 'This is a new groupbuy'
			});

			// Fixture mock form input values
			scope.groupbuy = {};
			scope.groupbuy.name = 'New Groupbuy';
			scope.groupbuy.description = 'This is a new groupbuy';

			// Set POST response
			$httpBackend.expectPOST('groupbuys', sampleGroupbuyPostData).respond(sampleGroupbuyResponse);

			// Run controller functionality
			scope.create(true);
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');
			expect(scope.description).toEqual('');


			// Test URL redirection after the Groupbuy was created
			expect($location.path()).toBe('/groupbuys/' + sampleGroupbuyResponse.slug + '/manage');
		}));

		it('$scope.update() should update a valid Groupbuy', inject(function(Groupbuys) {
			// Define a sample Groupbuy put data
			var sampleGroupbuyPutData = new Groupbuys({
				_id: '525cf20451979dea2c000001',
				name: 'New Groupbuy',
				slug: 'new-groupbuy',
				description: 'This is a new groupbuy'
			});

			// Mock Groupbuy in scope
			scope.groupbuy = sampleGroupbuyPutData;

			// Set PUT response
			$httpBackend.expectPUT(/groupbuys\/([0-9a-z\-]{10,80})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/groupbuys/' + sampleGroupbuyPutData.slug + '/manage');
		}));

		it('$scope.remove() should send a DELETE request with a valid groupbuySlug and remove the Groupbuy from the scope', inject(function(Groupbuys) {
			// Create new Groupbuy object
			var sampleGroupbuy = new Groupbuys({
				_id: '525a8422f6d0f87f0e407a33',
				slug: 'new-groupbuy'
			});

			// Create new Groupbuys array and include the Groupbuy
			scope.groupbuys = [sampleGroupbuy];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/groupbuys\/([0-9a-z\-]{10,80})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleGroupbuy);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.groupbuys.length).toBe(0);
		}));

// --------------------------
// Tabs controllers TESTS

		// Tests for GroupbuysTabInfoController
		it('$scope.addUpdate() should add an update to a valid Groupbuy', inject(function(Groupbuys) {
			// Define a sample Groupbuy put data
			var sampleGroupbuyPutData = new Groupbuys({
				_id: '525cf20451979dea2c000001',
				name: 'New Groupbuy',
				slug: 'new-groupbuy',
				description: 'This is a new groupbuy',
				updates: []
			});

			// Mock Groupbuy in scope
			scope.groupbuy = sampleGroupbuyPutData;

			// Set PUT response
			$httpBackend.expectPUT(/groupbuys\/([0-9a-z\-]{10,80})$/).respond();

			// Set the update content
			scope.newUpdate = 'Content of the update.';

			// Run controller functionality
			scope.addUpdate();
			$httpBackend.flush();

			// Test the update content
			expect(scope.groupbuy.updates.length).toBe(1);
			expect(scope.groupbuy.updates[0].textInfo).toBe('Content of the update.');

			// Test URL location to new object
			expect($location.path()).toBe('/groupbuys/' + sampleGroupbuyPutData.slug + '/manage');
		}));

	});
}());