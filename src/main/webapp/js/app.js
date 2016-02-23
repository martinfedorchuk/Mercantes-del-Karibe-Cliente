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
  var newYork;
  var montevideo;
  var caribbean;
  var caribeanZoneMin = Math.floor(worldBounds.yBottomRight / 10);
  var caribeanZoneMax = worldBounds.yBottomRight - Math.floor(worldBounds.yBottomRight / 10);

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
    game.load.image('empty', 'assets/empty.png');
    game.load.image('land', 'assets/pattern-land.png');
    game.load.image('port', 'assets/port.png');
    game.load.image('submarine', 'assets/ship-grey.png');
    game.load.image('red', 'assets/ship-red.png');
    game.load.image('island', 'assets/pattern-island.png');
  }

  function create() {
    // webSocketJs.setUser('submarine');

    // Creo el mundo
    game.stage.backgroundColor = '#2c8af4';
    game.world.setBounds(worldBounds.xTopLeft, worldBounds.yTopLeft, worldBounds.xBottomRight, worldBounds.yBottomRight);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    // Inicio el motor fisico
    game.physics.startSystem(Phaser.Physics.ARCADE);


    // Genero la zona del caribe
    generateCaribbean();
    // Genero las islas
    generateIslands();

    // Creo el submarino en una posicion aleatoria del caribe
    submarine = game.add.sprite(game.rnd.between(caribeanZoneMin, caribeanZoneMax), 
                                game.rnd.between(caribeanZoneMin, caribeanZoneMax), 'submarine');
    submarine.anchor.setTo(0.5, 0.5);
    game.physics.enable(submarine, Phaser.Physics.ARCADE);
    submarine.body.collideWorldBounds = true;

    red = game.add.sprite(100, 300, 'red');
    red.anchor.setTo(0.5, 0.5);
    game.physics.enable(red, Phaser.Physics.ARCADE);
    red.body.collideWorldBounds = true;


    // Pinta la tierra de new york
    newYork = game.add.tileSprite(worldBounds.xTopLeft, worldBounds.yTopLeft, worldBounds.xBottomRight, 129, 'land');
    game.physics.enable(newYork, Phaser.Physics.ARCADE);
    newYork.body.setSize(worldBounds.xBottomRight, 135, 0, 0);
    newYork.body.immovable = true;
    // Dibujo la linea del borde
    var newYorkLine = game.add.graphics(0, 0); 
    newYorkLine.beginFill(0xE3F89A);
    newYorkLine.drawRect(worldBounds.xTopLeft, worldBounds.yTopLeft + 129, worldBounds.xBottomRight, 6);
    newYorkLine.endFill();

    // Pinta la tierra de montevideo
    montevideo = game.add.tileSprite(worldBounds.xTopLeft, worldBounds.yBottomRight - 129, worldBounds.xBottomRight, 129, 'land');
    game.physics.enable(montevideo, Phaser.Physics.ARCADE);
    montevideo.body.setSize(worldBounds.xBottomRight, 135, 0, -6);
    montevideo.body.immovable = true;
    // Dibujo la linea del borde
    var montevideoLine = game.add.graphics(0, 0); 
    montevideoLine.beginFill(0xE3F89A);
    montevideoLine.drawRect(worldBounds.xTopLeft, worldBounds.yBottomRight - 135, worldBounds.xBottomRight, 6);
    montevideoLine.endFill();
    // Dibujo el puerto de montevideo
    var portMontevideo = game.add.sprite(game.rnd.between(worldBounds.xTopLeft + 440, worldBounds.xBottomRight), worldBounds.yBottomRight, 'port');
    portMontevideo.angle = 180;

    port = game.add.sprite(game.rnd.between(worldBounds.xTopLeft, worldBounds.xBottomRight - 440), 0, 'port');
    game.physics.enable(port, Phaser.Physics.ARCADE);
    port.body.setSize(400, 60, 20, 135);
    port.body.immovable = true;

    game.camera.follow(submarine);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

    shadowTexture = game.add.bitmapData(game.width, game.height);
    lightSprite = game.add.image(0, 0, shadowTexture);
    lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
    game.input.activePointer.x = submarine.x;
    game.input.activePointer.y = submarine.y;

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
    //game.physics.arcade.collide([shoreMon, shoreNY], submarine);
    game.physics.arcade.collide([newYork, montevideo], submarine);
    game.physics.arcade.overlap(port, submarine, function() {
      console.log("LLego!");
    });

    game.physics.arcade.collide(submarine, islands);
    game.physics.arcade.collide(red, submarine, function() {
      red.body.velocity = { x: 0, y: 0 };
      submarine.body.velocity = { x: 0, y: 0 };
      console.log("Boom!");
    });
    
    lightSprite.reset(game.camera.x, game.camera.y); 
    updateShadowTexture();
    
    // webSocketJs.sendMessage(submarine.x, submarine.y, submarine.angle);
     
    // webSocketJs.setOnMessage(function (message) {
    //     var jsonMsg = JSON.parse(message.data);
    //     if (jsonMsg.user == "red") {
    //       game.physics.arcade.accelerateToXY(red, jsonMsg.x, jsonMsg.y, 300);      
    //     }
    // });

    if (cursors.left.isDown)
    {
      submarine.body.rotation -= 4;
    }
    else if (cursors.right.isDown)
    {
      submarine.angle += 4;
    }
    else if (cursors.up.isDown)
    {
      currentSpeed = 300;
    }
    else if (currentSpeed > 0) {
        currentSpeed -= 5;
    } else 
    {
        submarine.body.velocity.x = 0;
        submarine.body.velocity.y = 0;
    }

    if (currentSpeed > 0)
    {
      game.physics.arcade.velocityFromRotation(submarine.rotation, currentSpeed, submarine.body.velocity);
    }

  }

  function render() {
    game.debug.body(submarine);
    game.debug.body(port);
  }

  var generateCaribbean = function() {
    // Creo las orillas
    // Montevideo
    shoreMon = game.add.tileSprite(worldBounds.xTopLeft, caribeanZoneMax, worldBounds.xBottomRight, caribeanZoneMin, 'empty');
    game.physics.enable(shoreMon, Phaser.Physics.ARCADE);
    shoreMon.body.immovable = true;
    // Nueva York
    shoreNY = game.add.tileSprite(worldBounds.xTopLeft, worldBounds.yTopLeft, worldBounds.xBottomRight, caribeanZoneMin, 'empty');
    game.physics.enable(shoreNY, Phaser.Physics.ARCADE);
    shoreNY.body.immovable = true;

    // Pinta la zona del caribe
    caribbean = game.add.graphics(0, 0); 
    caribbean.beginFill(0x2275D3);
    caribbean.drawRect(worldBounds.xTopLeft, caribeanZoneMin, worldBounds.xBottomRight, caribeanZoneMax - caribeanZoneMin);
    caribbean.endFill();
  }

  var generateIslands = function() {
    islands = game.add.group();

    // Seteo un valor random con la cantidad máxim
    var numberOfIslands = game.rnd.integerInRange(20, 40);
    
    var i = 0, x, y, width, height, island;

    // Genero las islas
    for (i; i < numberOfIslands; i++)
    {
      x = game.rnd.between(worldBounds.xBottomRight / numberOfIslands * i, 
        worldBounds.xBottomRight / numberOfIslands * (i + 1));

      y = game.rnd.between(caribeanZoneMin, caribeanZoneMax)
      
      width = game.rnd.between(100, 400);
      height = game.rnd.between(100, 400);

      island = game.add.tileSprite(x, y, width, height, 'island');
      
      game.physics.arcade.enable(island);
      island.body.immovable = true;
      island.anchor.setTo(0.5, 0.5);
      islands.add(island);
    }
  }
})();