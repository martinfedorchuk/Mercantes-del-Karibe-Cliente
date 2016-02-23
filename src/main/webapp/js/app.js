var appJs = (function  () {
  var game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container", { preload: preload, create: create, update: update, render: render });

  var ocean, port, submarine, red, shadowTexture, lightSprite, islands,
    currentSpeed = 0;

  var worldBounds = { 
    xTopLeft: 0,
    yTopLeft: 0,
    xBottomRight: 5000,
    yBottomRight: 5000
  };

  var LIGHT_RADIUS = 100;

  $(document).ready(function() {
    $("#btnLight").click(function(event) {
      event.preventDefault();
      game.camera.scale = new Phaser.Point(100, 100);
    });
  });

  var distanceBetweenAngles = function(alpha, beta) {
    var phi = Math.abs(beta - alpha) % 360;
    var distance = phi > 180 ? 360 - phi : phi;
    return distance;
  };

  function preload() {
    game.load.image('ocean', 'assets/pattern-land.png');
    game.load.image('port', 'assets/port.png');
    game.load.image('submarine', 'assets/ship-grey.png');
    game.load.image('red', 'assets/ship-red.png');
    game.load.image('island', 'assets/pattern-island.png');
  }

  function create() {
    webSocketJs.setUser('submarine');

    game.stage.backgroundColor = '#2c8af4';
    game.world.setBounds(worldBounds.xTopLeft, worldBounds.yTopLeft, worldBounds.xBottomRight, worldBounds.yBottomRight);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    game.physics.startSystem(Phaser.Physics.ARCADE);

    //ocean = game.add.tileSprite(0, 0, 800, 600, 'ocean');
    //ocean.fixedToCamera = true;

    submarine = game.add.sprite(300, 300, 'submarine');
    submarine.anchor.setTo(0.5, 0.5);
    game.physics.enable(submarine, Phaser.Physics.ARCADE);
    submarine.body.collideWorldBounds = true;

    red = game.add.sprite(100, 300, 'red');
    red.anchor.setTo(0.5, 0.5);
    game.physics.enable(red, Phaser.Physics.ARCADE);
    red.body.collideWorldBounds = true;

    port = game.add.sprite(0, 0, 'port');
    game.physics.enable(port, Phaser.Physics.ARCADE);
    port.body.collideWorldBounds = true;

    game.camera.follow(submarine);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

    shadowTexture = game.add.bitmapData(game.width, game.height);
    lightSprite = game.add.image(0, 0, shadowTexture);
    lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
    game.input.activePointer.x = submarine.x;
    game.input.activePointer.y = submarine.y;

    generateIslands();
  }

  var updateShadowTexture = function() {
    shadowTexture.context.fillStyle = 'rgb(100, 100, 100)';
    shadowTexture.context.fillRect(0, 0, game.width, game.height);

    // Dibujamos el circulo de luz
    shadowTexture.context.beginPath();
    shadowTexture.context.fillStyle = 'rgb(255, 255, 255)';
    shadowTexture.context.arc(submarine.x - game.camera.x, submarine.y - game.camera.y, LIGHT_RADIUS, 0, Math.PI*2);
    shadowTexture.context.fill();

    // Actualiza el cache de la textura
    shadowTexture.dirty = true;
  };

  function update() {
    game.physics.arcade.collide(port, submarine);
    game.physics.arcade.collide(submarine, islands);
    game.physics.arcade.collide(red, submarine, function() {
      red.body.velocity = { x: 0, y: 0 };
      submarine.body.velocity = { x: 0, y: 0 };
      console.log("Boom!");
    });
    
    lightSprite.reset(game.camera.x, game.camera.y); 
    updateShadowTexture();
    
    webSocketJs.sendMessage(submarine.x, submarine.y, submarine.angle);
     
    webSocketJs.setOnMessage(function (message) {
        var jsonMsg = JSON.parse(message.data);
        if (jsonMsg.user == "red") {
          game.physics.arcade.accelerateToXY(red, jsonMsg.x, jsonMsg.y, 300);      
        }
    });

    if (cursors.left.isDown)
    {
      currentSpeed = 300;
      submarine.angle = 180;
    }
    else if (cursors.right.isDown)
    {
      currentSpeed = 300;
      submarine.angle = 0;
    }
    else if (cursors.down.isDown)
    {
      currentSpeed = 300;
      submarine.angle = 90;
    }
    else if (cursors.up.isDown)
    {
      currentSpeed = 300;
      submarine.angle = -90;
    } else {
      if (currentSpeed > 0) {
        currentSpeed -= 5;
      } else {
        submarine.body.velocity.x = 0;
        submarine.body.velocity.y = 0;
      }
    }

    if (currentSpeed > 0)
    {
      game.physics.arcade.velocityFromRotation(submarine.rotation, currentSpeed, submarine.body.velocity);
    }

    //ocean.tilePosition.x = -game.camera.x;
    //ocean.tilePosition.y = -game.camera.y;
  }

  function render() {
    game.debug.body(submarine);
  }

  var generateIslands = function() {
    islands = game.add.group();

    // Seteo un valor random con la cantidad máxim
    var numberOfIslands = game.rnd.integerInRange(50, 70);
    
    var i = 0, x, y, width, height, island;
    var caribeanZoneMin = Math.floor(worldBounds.yBottomRight / 10);
    var caribeanZoneMax = worldBounds.yBottomRight - Math.floor(worldBounds.yBottomRight / 10);

    // Genero las islas
    for (i; i < numberOfIslands; i++)
    {
      x = game.rnd.between(worldBounds.xBottomRight / numberOfIslands * i, 
        worldBounds.xBottomRight / numberOfIslands * (i + 1));

      y = game.rnd.between(caribeanZoneMin, caribeanZoneMax)
      
      width = game.rnd.between(100, 200);
      height = game.rnd.between(100, 200);

      island = game.add.tileSprite(x, y, width, height, 'island');
      
      game.physics.arcade.enable(island);
      island.body.immovable = true;
      island.anchor.setTo(0.5, 0.5);
      islands.add(island);
    }
  }
})();