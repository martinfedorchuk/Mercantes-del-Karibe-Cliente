var appJs = (function  () {
  var game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container", { preload: preload, create: create, update: update, render: render});

  var ocean, port, submarine, red, shadowTexture;

  var currentSpeed = 0;

  var islands;
  var caribbean;
  var shoreMon;
  var shoreNY;
  const WORLD_START = 0;
  const WORLD_END = 2000;
  const SHORE_SIZE = 300;
  const LIGHT_RADIUS = 100;

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
    game.load.image('ocean', 'assets/pattern-land.png');
    game.load.image('port', 'assets/port.png');
    game.load.image('island', 'assets/pattern-island.png');
    game.load.image('submarine', 'assets/submarine-red.png');
    game.load.image('red', 'assets/ship-red.png');
  }

  function create() {
    // webSocketJs.setUser('submarine');

    game.stage.backgroundColor = '#2c8af4';

    game.world.setBounds(WORLD_START, WORLD_START, WORLD_END, WORLD_END);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    // Creo las orillas
    // Montevideo
    shoreMon = game.add.tileSprite(WORLD_START, WORLD_END - SHORE_SIZE, WORLD_END, SHORE_SIZE, 'empty');
    game.physics.enable(shoreMon, Phaser.Physics.ARCADE);
    shoreMon.body.immovable = true;
    // Nueva York
    shoreNY = game.add.tileSprite(WORLD_START, WORLD_START, WORLD_END, SHORE_SIZE, 'empty');
    game.physics.enable(shoreNY, Phaser.Physics.ARCADE);
    shoreNY.body.immovable = true;
    // Dibuja la zona del caribe
    caribbean = game.add.graphics(0, 0); 
    caribbean.beginFill(0x2275D3);
    caribbean.drawRect(WORLD_START, WORLD_START + SHORE_SIZE, WORLD_END, WORLD_END - 2 * SHORE_SIZE);
    caribbean.endFill();

    submarine = game.add.sprite(game.rnd.between(WORLD_START + SHORE_SIZE, WORLD_END - SHORE_SIZE), 
                                game.rnd.between(WORLD_START + SHORE_SIZE, WORLD_END - SHORE_SIZE), 'submarine');
    submarine.anchor.setTo(0.5, 0.5);
    game.physics.enable(submarine, Phaser.Physics.ARCADE);
    
    submarine.body.setSize(72, 72, 0, 0);

    submarine.body.collideWorldBounds = true;
    submarine.body.allowRotation = true;

    createMap();
    // red = game.add.sprite(100, 300, 'red');
    // red.anchor.setTo(0.5, 0.5);
    // game.physics.enable(red, Phaser.Physics.ARCADE);
    // red.body.collideWorldBounds = true;

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

    // Fija la camara en el barco
    //game.camera.follow(ship);
  }

  var updateShadowTexture = function() {
    shadowTexture.context.fillStyle = 'rgb(100, 100, 100)';
    shadowTexture.context.fillRect(0, 0, game.width, game.height);

    // Draw circle of light
    shadowTexture.context.beginPath();
    shadowTexture.context.fillStyle = 'rgb(255, 255, 255)';
    shadowTexture.context.arc(submarine.x, submarine.y, LIGHT_RADIUS, 0, Math.PI*2);
    shadowTexture.context.fill();

    // This just tells the engine it should update the texture cache
    shadowTexture.dirty = true;
  };

  var createMap = function() {


    islands = game.add.group();
    // Seteo un valor random con la cantidad de islas
    var numberOfIslands = game.rnd.integerInRange(5, 10);
    // Genero las islas
    for (var i = 0; i < numberOfIslands; i++)
    {
        var island = game.add.tileSprite(game.rnd.between(WORLD_END / numberOfIslands * i, WORLD_END / numberOfIslands * (i+1)), game.rnd.between(WORLD_START + SHORE_SIZE, WORLD_END - SHORE_SIZE), game.rnd.between(50, 150), game.rnd.between(50, 150), 'island');
        game.physics.arcade.enable(island);
        island.body.immovable = true;
        island.anchor.setTo(0.5, 0.5);
        islands.add(island);
    }
    
    
  }

  function update() {
    game.physics.arcade.collide([shoreMon, shoreNY], submarine);
    game.physics.arcade.collide(port, submarine);
    game.physics.arcade.collide(submarine, islands);
    game.physics.arcade.collide(red, submarine, function() {
      red.body.velocity = { x: 0, y: 0 };
      submarine.body.velocity = { x: 0, y: 0 };
      console.log("Boom!");
    });
    
    // updateShadowTexture();
    
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

  }

  function render() {
    game.debug.body(submarine);
    // game.debug.body(shore);
    game.debug.geom(caribbean,'#0fffff');
    
  }
})();