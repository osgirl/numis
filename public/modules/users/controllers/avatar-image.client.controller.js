'use strict';

/**
 * @ngdoc controller
 * @name users.controller:AvatarImageController
 *
 * @requires $cope
 * @requires $upload
 *
 * @description
 * Contolador de la imágen de avatar en el perfil de usuario
 */

angular.module('users').controller('AvatarImageController', ['$scope', 'Restangular', 'Authentication', '$translate', '$upload', '$timeout',
	function($scope, Restangular, Authentication, $translate, $upload, $timeout) {

		$scope.authentication = Authentication;

		Restangular.one('users', 'me').get().then(function(data) {
			//$scope.user = data;
			$scope.imgAvatarSrc = data._links.avatar.href;

		}, function errorCallback() {
			$scope.error = $translate.instant('core.Error_connecting_server');
		});

		/**
		* @ngdoc method
		* @name users.controller:AvatarImageController.$scope·onFileSelect
		* @methodOf users.controller:AvatarImageController
		*
		* @description
		* Envía las imágenes al servidor
		*/
		$scope.onFileSelect = function($images) {
			var upload_url = $scope.imgAvatarSrc,
				image = $images[0];

			$scope.uploadInProgress = true;
			$scope.uploadProgress = 0;

			$scope.upload = $upload.upload({
				url: upload_url, // upload.php script, node.js route, or servlet url
				method: 'PUT', // POST or PUT
				//headers: {'Authorization': 'xxx'}, // only for html5
				//withCredentials: true,
				/*
				data: {
					type: 'profile'
				},
				*/
				file: image,  // single file or a list of files. list is only for html5
				//fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
				//fileFormDataName: 'image',
					// file formData name ('Content-Disposition'), server side request form name
					// could be a list of names for multiple files (html5). Default is 'file'
				//formDataAppender: function(formData, key, val){}
					// customize how data is added to the formData.
					// See https://github.com/danialfarid/angular-file-upload/pull/40#issuecomment-28612000 for sample code

			}).progress(function(evt) {
				//console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file');
				$timeout(function() {
					$scope.uploadProgress = Math.floor(evt.loaded / evt.total);
					$scope.$apply();
				});
			}).success(function(data, status, headers, config) {
				// file is uploaded successfully
				// Refresh avatar image
				$timeout(function() {
					$scope.imgAvatarSrc = $scope.imgAvatarSrc + '?decache=' + Math.random();
				}, 2000);

			}).error(function(err) {
				$scope.uploadInProgress = false;
			});
			//.then(success, error, progress); // returns a promise that does NOT have progress/abort/xhr functions
			//.xhr(function(xhr){xhr.upload.addEventListener(...)}) // access or attach event listeners to
			//the underlying XMLHttpRequest

			/** alternative way of uploading, send the file binary with the file's content-type.
			 * 	Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
			 * 	It could also be used to monitor the progress of a normal http post/put request.
			 * 	Note that the whole file will be loaded in browser first so large files could crash the browser.
			 * 	You should verify the file size before uploading with $upload.http().
			 */
			// $scope.upload = $upload.http({...})
			// See https://github.com/danialfarid/angular-file-upload/pull/88#issuecomment-31366487 for sample code.
		};

	}
]);