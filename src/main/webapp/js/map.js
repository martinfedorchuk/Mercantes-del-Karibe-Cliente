var mapJs = (function() {
  var map, 
    mapWidth = 1000, 
    mapHeight = 1000,
    $mapContainer;

  var getRandomInt = function(min, max)  {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  var drawXAxisLines = function() {
    for (var i = 0; i < mapWidth; i++) {
      if (i % 50 == 0) {
        map.line(i, 0, i, 1000).addClass("axis");
      }
    }
  };

  var drawYAxisLines = function() {
    for (var i = 0; i < mapHeight; i++) {
      if (i % 50 == 0) {
        map.line(0, i, 1000, i).addClass("axis");
      }
    }
  };

  var drawIslands = function() {

      map.rect(xCoord, yCoord, 50, 50).addClass("island");
    }
  };

  var drawPort = function() {
    Snap.load("assets/port.svg", function(port) {
      map.append(port);
    });
  };

  var getMap = function() {
    return Snap(".world-map");
  };

  var init = function() {
    $mapContainer = $(".svg-container")[0];
    map = Snap(mapWidth, mapHeight).addClass("world-map");
    map.appendTo($mapContainer);

     // drawXAxisLines();
     // drawYAxisLines();

     drawIslands();
     // drawPort();
  };

  return {
    initMap: init,
    getMap: getMap
  }
})();