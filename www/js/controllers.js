angular.module('starter.controllers', [])

    .controller('DashCtrl', function ($scope, $ionicPlatform)
    {
        //some default values for the models we're using
        $scope.geoInfo = {
            timestamp: null,
            coords: {}
        };

        $scope.userHeading = 0;
        $scope.barDirection = 0;
        $scope.goThisWay = 0;
        $scope.nearbyBars = {};
        $scope.GPSWatchID = {};
        $scope.compassWatchID = {};
        $scope.geoOptions = {
            enableHighAcuracy: true,
            maximumAge: 3000
        };
        $scope.compass = {
            x2: 0,
            y2: 0
        };

        //convert a timestamp to human readable format
        $scope.humanDate = function (timestamp)
        {
            if (timestamp === null)
            {
                return "";
            }
            var time = new Date(timestamp);

            return time.toLocaleString();
        };
        $scope.setDirection = function(bar)
        {
            var latUser = $scope.geoInfo.coords.latitude;
            var longUser = $scope.geoInfo.coords.longitude;
            var userLocation = new google.maps.LatLng(latUser, longUser);
            console.log("User Loc: ", JSON.stringify(userLocation));
            var latBar = bar.geometry.location.k;
            var longBar = bar.geometry.location.D;
            var barLocation = new google.maps.LatLng(latBar, longBar);
            console.log("Bar Loc: ", JSON.stringify(barLocation));
            console.log("Bar Name: ", bar.name);
            //$scope.barDirection = Math.atan2(latBar - latUser, latBar - longUser) * (180/Math.PI);
            $scope.barDirection = google.maps.geometry.spherical.computeHeading(userLocation, barLocation);
            console.log("Computed Heading is: ", JSON.stringify($scope.barDirection));
        };


        $scope.onGeoError = function(error)
        {
            console.log("Ran into an Error: ", error);
        };

        //update nearest bar list
        $scope.updateBars = function(position)
        {
            var userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            //Let's start up the Google Places Stuff
            var barMap = new google.maps.Map(document.getElementById('bar-map'),
                {
                    center: userLocation
                });
            var placesService = new google.maps.places.PlacesService(barMap);

            var searchRequest = {
                location: userLocation,
                rankBy: google.maps.places.RankBy.DISTANCE,
                types: ['bar']
            };

            placesService.nearbySearch(searchRequest, function(results, status)
            {
                if (status == google.maps.places.PlacesServiceStatus.OK)
                {
                    $scope.nearbyBars = results;
                    $scope.setDirection(results[0]);
                    $scope.$apply();
                }
            });
        };

        //manual update of the location
        $scope.updatePosition = function(callback)
        {
            navigator.geolocation.getCurrentPosition(function (position)
            {
                console.log("Get Current Position Results: ", JSON.stringify(position));
                $scope.geoInfo = position;
                $scope.$apply();

                //if this is the initial call, we'll likely need to start the google stuff here
                if (typeof callback === "function")
                {
                    callback(position);
                }
            },
            $scope.onGeoError,
            $scope.geoOptions);
        };

        //compass stuff
        $scope.startCompassWatcher = function()
        {
            $scope.compassWatchID = navigator.compass.watchHeading(function(heading)
            {
                $scope.userHeading = heading;
                //console.log(JSON.stringify(heading));
                $scope.goThisWay = degreeDifference($scope.userHeading.magneticHeading, $scope.barDirection);

                //TODO:: This diameter shouldn't be hardcoded
                $scope.compass = resolveToPoint($scope.goThisWay, 200);

                $scope.$apply();

                function degreeDifference(deg1, deg2)
                {
                    return (360 - deg1 + deg2 > 360) ? deg2-deg1 : 360 - deg1 + deg2;
                }
                //http://stackoverflow.com/questions/8796690/algorithm-function-to-resolve-degrees-to-x-y-for-drawing-svg-pie-graphs
                function resolveToPoint(deg, diameter)
                {
                    deg = (deg - 90 < 0) ? deg + 270: deg - 90;
                    var rad = Math.PI * deg / 180;
                    var r = diameter / 2;
                    return {x2: r * Math.cos(rad) + 150, y2: r * Math.sin(rad) + 150};
                }
            },$scope.onGeoError,
            {

            });
        };
        $scope.clearCompassWatcher = function()
        {
            navigator.compass.clearWatch($scope.compassWatchID);
            console.log("COMPASS WATCH CLEARED");
        };
        //start watching position
        $scope.startGPSWatcher = function()
        {
            $scope.watchID = navigator.geolocation.watchPosition(function(position)
            {
                console.log("Position is now: ",JSON.stringify(position));
                $scope.geoInfo = position;
                $scope.updateBars(position);
                $scope.$apply();
            },
            $scope.onGeoError,
            $scope.geoOptions);
        };

        //stop the watcher
        $scope.clearGPSWatcher = function()
        {
            navigator.geolocation.clearWatch($scope.GPSWatchID);
            console.log("GPS WATCH CLEARED");
        };

        //When the platform is ready, let's get busy
        $ionicPlatform.ready(function ()
        {
            $scope.updatePosition($scope.updateBars);
            $scope.startCompassWatcher();
        });

    })

    .controller('ChatsCtrl', function ($scope, Chats)
    {
        $scope.chats = Chats.all();
        $scope.remove = function (chat)
        {
            Chats.remove(chat);
        }
    })

    .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats)
    {
        $scope.chat = Chats.get($stateParams.chatId);
    })

    .controller('FriendsCtrl', function ($scope, Friends)
    {
        $scope.friends = Friends.all();
    })

    .controller('FriendDetailCtrl', function ($scope, $stateParams, Friends)
    {
        $scope.friend = Friends.get($stateParams.friendId);
    })

    .controller('AccountCtrl', function ($scope)
    {
        $scope.settings = {
            enableFriends: true
        };
    });
