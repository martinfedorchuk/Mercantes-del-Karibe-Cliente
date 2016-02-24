var appJs = (function  () {
  var game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container", { preload: preload, create: create, update: update, render: render });

  var ocean, port, submarine, red, shadowTexture, lightSprite, islands,
    currentSpeed = 0, bmd, mask;
    var firstTime = true;


  var worldBounds = { 
    xTopLeft: 0,
    yTopLeft: 0,
    xBottomRight: 5000,
    yBottomRight: 5000
  };

  var bullet;
  var bulletButton = null;
  var fireRateBullet = 500;
  var nextFire = 0;
  var missile;
  var missileButton = null;

  var newYork;
  var montevideo;
  var caribbean;
  var caribeanZoneMin = Math.floor(worldBounds.yBottomRight / 10);
  var caribeanZoneMax = worldBounds.yBottomRight - Math.floor(worldBounds.yBottomRight / 10);

  var LIGHT_RADIUS = 200;

  $(document).ready(function() {
    $("#btnLight").click(function(event) {
      event.preventDefault();
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
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('missile', 'assets/missile.png');
  }

  function create() {
    // Creo el mundo
    game.stage.backgroundColor = '#000000';
    game.world.setBounds(0, 0, worldBounds.xBottomRight, worldBounds.yBottomRight);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    var sea = game.add.graphics(0, 0); 
    sea.beginFill(0x2c8af4);
    sea.drawRect(worldBounds.xTopLeft, worldBounds.yTopLeft, worldBounds.xBottomRight, worldBounds.yBottomRight);
    sea.endFill();

    // Inicio el motor fisico
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Genero la zona del caribe
    generateCaribbean();
    // Genero las islas
    generateIslands();

    // ------------------------------------------------------------------

    //  A single bullet that the tank will fire
    bullet = game.add.sprite(0, 0, 'bullet');
    bullet.anchor.setTo(0.5, 0.5);
    bullet.exists = false;
    game.physics.arcade.enable(bullet);
    bullet.body.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;

    bulletButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    // bulletButton.onDown.add(fireBullet, game);

    // ------------------------------------------------------------------

    // Obtengo una posicion aleatoria dentro del caribe
    var rndX = game.rnd.between(caribeanZoneMin, caribeanZoneMax);
    var rndY = game.rnd.between(caribeanZoneMin, caribeanZoneMax);
    // Creo el submarino
    submarine = game.add.sprite(100, 300, 'submarine');
    submarine.anchor.setTo(0.5, 0.5);
    game.physics.enable(submarine, Phaser.Physics.ARCADE);
    submarine.body.collideWorldBounds = true;

    

    // Creo el barco
    red = game.add.sprite(200, 500, 'red');
    red.anchor.setTo(0.5, 0.5);
    game.physics.enable(red, Phaser.Physics.ARCADE);
    red.body.collideWorldBounds = true;

    // Genero los puertos con sus tierras
    generatePorts();

    // Seteo que la camara siga al submarino
    game.camera.follow(submarine);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

    // Genero una mascara y la aplico al world
    // Esto determina la vision del barco
    mask = game.add.graphics(0, 0);
    mask.beginFill(0x000000);
    mask.drawCircle(0, 0, 800);
    game.world.mask = mask;

    game.input.activePointer.x = submarine.x;
    game.input.activePointer.y = submarine.y;

  }

  var updateShadowTexture = function() {
    shadowTexture.context.fillStyle = 'rgb(10, 10, 10)';
    shadowTexture.context.fillRect(-10, -10, game.width + 100, game.height + 100);

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
      alert("LLego!");
      submarine.kill();
      // una vez que muere puede seguir al otro
      game.camera.follow(red);
      mask.destroy();
    });

    game.physics.arcade.collide(submarine, islands);
    game.physics.arcade.collide(red, submarine, function() {
      //red.body.velocity = { x: 0, y: 0 };
      //submarine.body.velocity = { x: 0, y: 0 };
      alert("Boom!");
      red.kill();
    });
    
    mask.x = submarine.body.x + 36;
    mask.y = submarine.body.y + 36;
    
    // Manda la posicion al server
    if (submarine.alive) {
      webSocketJs.sendMessage('submarine', submarine.x, submarine.y, submarine.angle);
    }
  
    // Recibe la posición del oponente y la actualiza
    webSocketJs.setOnMessage(function (message) {
        var jsonMsg = JSON.parse(message.data);
        // console.log(jsonMsg.user);
        // console.log(jsonMsg.x);
        // console.log(jsonMsg.y);
        // console.log(jsonMsg.angle);
        if (jsonMsg.user == "red") {
          red.x = jsonMsg.x;
          red.y = jsonMsg.y;
          red.angle = jsonMsg.angle;
        }
    });

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

    if (bulletButton.isDown) {
      fireBullet();
    }
    game.physics.arcade.collide(bullet, red, function() {
      red.kill();
      bullet.kill();
      alert('Rojo hundido');
    });
    game.physics.arcade.collide([red, newYork, montevideo, islands], bullet, function() {
      bullet.kill();
    });


  }

  function render() {
    //game.debug.body(submarine);
    //game.debug.body(red);
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

  var fireBullet = function() {
    
    if (game.time.now > nextFire) {

      nextFire = game.time.now + fireRateBullet;
      bullet.reset(submarine.x, submarine.y);
      bullet.rotation = submarine.rotation;

      // var gunPointing = Math.PI * 1.5;  // Izquierda
      // var gunPointing = Math.PI * 0.5;  // Derecha
      var gunPointing = 0;              // Frente

      //  Disparo la bala considerando la direccion del barco
      game.physics.arcade.velocityFromRotation(submarine.rotation + gunPointing, 500, bullet.body.velocity);
      
      var tween = game.add.tween(bullet).to(null, fireRateBullet, null, false, 0, 0, false);
      
      tween.onComplete.add(function() {
        bullet.kill();
      });
      tween.start();
    }

  }

  var fireMissile = function() {
    
    if (game.time.now > nextFire) {

      nextFire = game.time.now + fireRate;
      bullet.reset(submarine.x, submarine.y);
      bullet.rotation = submarine.rotation;

      // var gunPointing = Math.PI * 1.5;  // Izquierda
      // var gunPointing = Math.PI * 0.5;  // Derecha
      var gunPointing = 0;              // Frente

      //  Disparo la bala considerando la direccion del barco
      game.physics.arcade.velocityFromRotation(submarine.rotation + gunPointing, 350, bullet.body.velocity);
      
      var tween = game.add.tween(bullet).to(null, 500, null, false, 0, 0, false);
      
      tween.onComplete.add(function() {
        bullet.kill();
      });
      tween.start();
    }
    
  }

  var generateIslands = function() {
    islands = game.add.group();

    // Seteo un valor random con la cantidad de islas
    var numberOfIslands = game.rnd.integerInRange(15, 30);
    
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

  var generatePorts = function() {
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
    // Dibujo el puerto de new york
    port = game.add.sprite(game.rnd.between(worldBounds.xTopLeft, worldBounds.xBottomRight - 440), 0, 'port');
    game.physics.enable(port, Phaser.Physics.ARCADE);
    port.body.setSize(400, 60, 20, 135);
    port.body.immovable = true;

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
  }


})();