var webSocketJs = (function() {  
  var ip = "192.168.1.49";
  var websocket = new WebSocket("ws://"+ ip +":8080/Mercantes-del-Karibe/wsServerEndpoint");

  var sendMessage = function (x, y, angle) {       
    var obj = {
      x: x,
      y: y,
      angle: angle
    }

    websocket.send(JSON.stringify(obj));
  }

  var setUser = function (name) {       
    websocket.send(name);
  }

  function setOnMessage(fn) {
    websocket.onmessage = fn;
  }

  return {
    sendMessage: sendMessage,
    setOnMessage : setOnMessage,
    setUser: setUser
  }
})();