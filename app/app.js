"use strict"

var AUTH_USER = 'FbcJ50iTVGDWr2sFwQJA9CvxKNZyJE-0sSna0loH',
    UPNP_URL = 'https://www.meethue.com/api/nupnp';

angular.module('hueApp', [])
    .controller('HueController', function ($scope, $http, $timeout, hueFactory) {
        var internalIpAddress = '';

        var lightCategories = {
            LTW001: {
                id: 'LTW001',
                type: 'ambiance',
                socket: 'bulb'
            },
            LTW013: {
                id: 'LTW013',
                type: 'ambiance',
                socket: 'spot'
            },
            LWB010: {
                id: 'LWB010',
                type: 'white',
                socket: 'bulb'
            },
            LCT010: {
                id: 'LCT010',
                type: 'color',
                socket: 'bulb'
            },
            LST002: {
                id: 'LST002',
                type: 'color',
                socket: 'strip'
            }
        }


        function getAllLights(groups) {

            hueFactory.getAllLights(internalIpAddress)
                .then(function successCallback(response) {
                    // console.log('lights : ', response.data);

                    $scope.lightsGrouped = [];

                    var lightDetails = response.data;

                    angular.forEach(groups, function (group, key) {
                        console.log(group.class);
                        var groupWithLights = {
                            id: key,
                            type: group.type,
                            name: group.name,
                            class: group.class ? group.class.replace(/\s/g, '').toLowerCase() : '',
                            lights: [],
                            state: group.state
                        }

                        group.lights.forEach(function (lightId) {
                            var light = lightDetails[lightId];
                            light.id = lightId;
                            light.category = lightCategories[light.modelid];
                            groupWithLights.lights.push(light);
                        });

                        $scope.lightsGrouped.push(groupWithLights);
                    });

                    console.log('$scope.lightsGrouped : ', $scope.lightsGrouped);

                }, function (error) {
                    $scope.status = 'Unable to load lights: ' + error.message;
                });
        }

        function getAllGroups() {

            hueFactory.getAllGroups(internalIpAddress)
                .then(function successCallback(response) {
                    // console.log('groups : ', response.data);

                    getAllLights(response.data);
                }, function (error) {
                    $scope.status = 'Unable to load groups: ' + error.message;
                });

            // $timeout(function () {
            //     getAllGroups();
            // }, 3000);
        }

        function getInternatIpAddress() {

            hueFactory.getInternatIpAddress()
                .then(function successCallback(response) {
                    internalIpAddress = response.data[0].internalipaddress;
                    getAllGroups();
                    // getAllLights();


                }, function (error) {
                    $scope.status = 'Unable to get internal url: ' + error.message;
                });
        }

        $scope.toggleLightGroup = function (group) {
            console.log('group = ', group);
            hueFactory.toggleGroup(internalIpAddress, group)
                .then(function successCallback(response) {
                    getAllGroups();
                });
        }

        $scope.toggleLight = function (light) {
            console.log('light = ', light);
            hueFactory.toggleLight(internalIpAddress, light)
                .then(function successCallback(response) {
                    getAllGroups();
                });
        }

        function init() {
            getInternatIpAddress();
        }
        init();

    })
    .factory('hueFactory', ['$http', function ($http) {
        return {
            getInternatIpAddress: function () {
                return $http.get(UPNP_URL);
            },
            getAllLights: function (internalIpAddress) {
                return $http.get('http://' + internalIpAddress + '/api/' + AUTH_USER + '/lights');
            },
            getAllGroups: function (internalIpAddress) {
                return $http.get('http://' + internalIpAddress + '/api/' + AUTH_USER + '/groups');
            },
            toggleGroup: function (internalIpAddress, group) {
                return $http({
                    method: 'PUT',
                    url: 'http://' + internalIpAddress + '/api/' + AUTH_USER + '/groups/' + group.id + '/action',
                    data: '{"on":' + !group.state.all_on + '}'
                });
            },
            toggleLight: function (internalIpAddress, light) {
                return $http({
                    method: 'PUT',
                    url: 'http://' + internalIpAddress + '/api/' + AUTH_USER + '/lights/' + light.id + '/state',
                    data: '{"on":' + !light.state.on + '}'
                });
            }
        }
    }])
    .filter('roomOnly', function () {
        return function (input) {
            if (!input)
                return input;

            var result = {};
            angular.forEach(input, function (value, key) {
                if (value.type === 'Room')
                    result[key] = value;
            });

            return result;
        }
    });