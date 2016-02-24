var webSocketJs = (function() {  
  var ip = "192.168.0.128";
  var websocket = new WebSocket("ws://"+ ip +":8080/Mercantes-del-Karibe/wsServerEndpoint");

  var sendMessage = function (user, x, y, angle) {       
    var obj = {
      user: user,
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