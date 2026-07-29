class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.worldSize = 4000;
    this.gridSize = 40;
    this.snakeRadius = 14;
    this.baseSpeed = 3.5;
    this.boostSpeed = 6.5;
    this.turnSpeed = 0.12;
    this.aiCount = 5;
    this.foodCount = 100;
    this.kills = 0;

    // 相机边界
    this.cameras.main.setBounds(0, 0, this.worldSize, this.worldSize);

    // 背景网格
    this.add.tileSprite(this.worldSize/2, this.worldSize/2, this.worldSize, this.worldSize, 'grid')
      .setAlpha(0.3).setDepth(0);

    // 世界边界
    const border = this.add.graphics();
    border.lineStyle(4, 0xff006e, 0.4);
    border.strokeRect(0, 0, this.worldSize, this.worldSize);
    border.setDepth(1);

    // 物理世界边界
    this.physics.world.setBounds(0, 0, this.worldSize, this.worldSize);

    // 食物组
    this.foods = this.physics.add.group();
    for (let i = 0; i < this.foodCount; i++) this.spawnFood();

    // 粒子
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(10);

    // 创建蛇
    this.snakes = [];
    this.player = this.createSnake(this.worldSize/2, this.worldSize/2, 'snake-head', 'snake-body', 0x00ffc8, true, '你');
    this.snakes.push(this.player);

    const aiNames = ['红莲', '暗影', '雷霆', '幽灵', '烈焰'];
    const aiHeads = ['ai-head-0','ai-head-1','ai-head-2','ai-head-3','ai-head-4'];
    const aiBodies = ['ai-body-0','ai-body-1','ai-body-2','ai-body-3','ai-body-4'];
    const aiColors = [0xff006e, 0x8338ec, 0x3a86ff, 0xfb5607, 0xffbe0b];

    for (let i = 0; i < this.aiCount; i++) {
      const angle = (Math.PI * 2 / this.aiCount) * i;
      const dist = 700;
      const x = this.worldSize/2 + Math.cos(angle) * dist;
      const y = this.worldSize/2 + Math.sin(angle) * dist;
      const snake = this.createSnake(x, y, aiHeads[i], aiBodies[i], aiColors[i], false, aiNames[i]);
      this.snakes.push(snake);
    }

    // 输入
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      boost: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // 相机跟随
    this.cameras.main.startFollow(this.player.head, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // 碰撞
    this.physics.add.overlap(this.player.head, this.foods, (head, food) => {
      this.eatFood(this.player, food);
    });

    // HUD场景
    this.scene.launch('HUDScene', { gameScene: this });

    // 定时器：AI思考
    this.time.addEvent({ delay: 100, callback: this.updateAI, callbackScope: this, loop: true });
  }

  createSnake(x, y, headKey, bodyKey, color, isPlayer, name) {
    const snake = {
      head: this.physics.add.sprite(x, y, headKey).setDepth(5),
      body: this.add.group(),
      bodyKey, color, isPlayer, name,
      angle: Math.random() * Math.PI * 2,
      targetAngle: Math.random() * Math.PI * 2,
      length: 12,
      maxLength: 12,
      speed: this.baseSpeed,
      boosting: false,
      dead: false,
      score: 0,
      aiState: 'wander',
      aiTimer: 0,
      aiTarget: null
    };
    snake.head.setCircle(12);
    snake.head.setData('snake', snake);

    // 初始身体
    for (let i = 1; i < snake.length; i++) {
      const seg = this.physics.add.sprite(x - i * 18, y, bodyKey).setDepth(4);
      seg.setCircle(10);
      snake.body.add(seg);
    }
    return snake;
  }

  spawnFood() {
    const x = Phaser.Math.Between(50, this.worldSize - 50);
    const y = Phaser.Math.Between(50, this.worldSize - 50);
    const food = this.physics.add.sprite(x, y, 'food').setDepth(2);
    food.setCircle(8);
    // 发光效果
    const glow = this.add.circle(x, y, 12, 0x00ffc8, 0.2).setDepth(1);
    this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.05, duration: 1000, yoyo: true, repeat: -1 });
    food.setData('glow', glow);
    this.foods.add(food);
  }

  eatFood(snake, food) {
    if (snake.dead) return;
    const glow = food.getData('glow');
    if (glow) glow.destroy();
    food.destroy();
    snake.maxLength += 1;
    snake.score += 10;
    this.particles.emitParticleAt(food.x, food.y, 8);
    this.spawnFood();
  }

  update() {
    if (!this.player || this.player.dead) {
      this.checkGameOver();
      return;
    }

    // 玩家控制
    let targetDir = null;
    if (this.cursors.up.isDown || this.wasd.up.isDown) targetDir = -Math.PI / 2;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) targetDir = Math.PI / 2;
    else if (this.cursors.left.isDown || this.wasd.left.isDown) targetDir = Math.PI;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) targetDir = 0;

    if (targetDir !== null) this.player.targetAngle = targetDir;
    this.player.boosting = this.wasd.boost.isDown;

    // 更新所有蛇
    for (const snake of this.snakes) {
      if (snake.dead) continue;
      this.updateSnake(snake);
    }

    // 碰撞检测（蛇头撞其他蛇身体）
    for (const snake of this.snakes) {
      if (snake.dead) continue;
      for (const other of this.snakes) {
        if (other === snake || other.dead) continue;
        const bodySprites = other.body.getChildren();
        const startIdx = other === snake ? 5 : 0;
        for (let i = startIdx; i < bodySprites.length; i++) {
          if (Phaser.Geom.Intersects.CircleToCircle(
            new Phaser.Geom.Circle(snake.head.x, snake.head.y, 10),
            new Phaser.Geom.Circle(bodySprites[i].x, bodySprites[i].y, 9)
          )) {
            this.killSnake(snake);
            if (!snake.isPlayer && other.isPlayer) this.kills++;
            break;
          }
        }
        if (snake.dead) break;
      }
    }

    // 头对头碰撞
    for (let i = 0; i < this.snakes.length; i++) {
      for (let j = i + 1; j < this.snakes.length; j++) {
        const s1 = this.snakes[i], s2 = this.snakes[j];
        if (s1.dead || s2.dead) continue;
        if (s1.head.body.touching.none && s2.head.body.touching.none) {
          const dist = Phaser.Math.Distance.Between(s1.head.x, s1.head.y, s2.head.x, s2.head.y);
          if (dist < 20) {
            if (s1.length > s2.length) { this.killSnake(s2); if (s1.isPlayer) this.kills++; }
            else if (s1.length < s2.length) { this.killSnake(s1); if (s2.isPlayer) this.kills++; }
            else { this.killSnake(s1); this.killSnake(s2); }
          }
        }
      }
    }

    // 边界检测
    for (const snake of this.snakes) {
      if (snake.dead) continue;
      if (snake.head.x < 10 || snake.head.x > this.worldSize - 10 ||
          snake.head.y < 10 || snake.head.y > this.worldSize - 10) {
        this.killSnake(snake);
      }
    }
  }

  updateSnake(snake) {
    // 平滑转向
    let diff = snake.targetAngle - snake.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    snake.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed);

    // 速度
    if (snake.boosting && snake.length > 6) {
      snake.speed = this.boostSpeed;
      snake.maxLength -= 0.02;
      if (Math.random() < 0.3) {
        const tail = snake.body.getChildren()[snake.body.getChildren().length - 1];
        if (tail) this.particles.emitParticleAt(tail.x, tail.y, 1);
      }
    } else {
      snake.speed = this.baseSpeed;
    }

    // 移动头部
    const vx = Math.cos(snake.angle) * snake.speed;
    const vy = Math.sin(snake.angle) * snake.speed;
    snake.head.setVelocity(vx * 60, vy * 60);
    snake.head.setRotation(snake.angle);

    // 身体跟随
    const bodySprites = snake.body.getChildren();
    let prev = snake.head;
    for (let i = 0; i < bodySprites.length; i++) {
      const seg = bodySprites[i];
      const dist = Phaser.Math.Distance.Between(prev.x, prev.y, seg.x, seg.y);
      const segLen = 16;
      if (dist > segLen) {
        const angle = Phaser.Math.Angle.Between(seg.x, seg.y, prev.x, prev.y);
        seg.x = prev.x - Math.cos(angle) * segLen;
        seg.y = prev.y - Math.sin(angle) * segLen;
        seg.setRotation(angle);
      }
      prev = seg;
    }

    // 调整身体数量
    const targetCount = Math.floor(snake.maxLength * 1.3);
    const currentCount = bodySprites.length;
    if (currentCount < targetCount) {
      const tail = bodySprites[currentCount - 1] || snake.head;
      const seg = this.physics.add.sprite(tail.x, tail.y, snake.bodyKey).setDepth(4);
      seg.setCircle(10);
      snake.body.add(seg);
    } else if (currentCount > targetCount && currentCount > 3) {
      const seg = bodySprites[bodySprites.length - 1];
      snake.body.remove(seg, true, true);
    }
    snake.length = snake.maxLength;

    // AI吃食物碰撞
    if (!snake.isPlayer) {
      const foods = this.foods.getChildren();
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (Phaser.Math.Distance.Between(snake.head.x, snake.head.y, f.x, f.y) < 22) {
          this.eatFood(snake, f);
        }
      }
    }
  }

  updateAI() {
    for (const snake of this.snakes) {
      if (snake.isPlayer || snake.dead) continue;
      snake.aiTimer++;

      const pos = new Phaser.Math.Vector2(snake.head.x, snake.head.y);

      // 找最近食物
      let nearestFood = null, nearestFoodDist = Infinity;
      for (const f of this.foods.getChildren()) {
        const d = Phaser.Math.Distance.Between(snake.head.x, snake.head.y, f.x, f.y);
        if (d < nearestFoodDist && d < 500) { nearestFoodDist = d; nearestFood = f; }
      }

      // 找最近敌人
      let nearestEnemy = null, nearestEnemyDist = Infinity;
      for (const other of this.snakes) {
        if (other === snake || other.dead) continue;
        const d = Phaser.Math.Distance.Between(snake.head.x, snake.head.y, other.head.x, other.head.y);
        if (d < nearestEnemyDist) { nearestEnemyDist = d; nearestEnemy = other; }
      }

      let desiredAngle = snake.angle;

      // 威胁判断
      if (nearestEnemy && nearestEnemyDist < 180) {
        if (nearestEnemy.length > snake.length + 2) {
          // 逃跑
          desiredAngle = Phaser.Math.Angle.Between(nearestEnemy.head.x, nearestEnemy.head.y, snake.head.x, snake.head.y);
          snake.boosting = nearestEnemyDist < 100;
          snake.aiState = 'flee';
        } else if (snake.length > nearestEnemy.length + 2 && nearestEnemyDist < 120) {
          // 追击
          desiredAngle = Phaser.Math.Angle.Between(snake.head.x, snake.head.y, nearestEnemy.head.x, nearestEnemy.head.y);
          snake.boosting = true;
          snake.aiState = 'chase';
        }
      } else if (nearestFood) {
        desiredAngle = Phaser.Math.Angle.Between(snake.head.x, snake.head.y, nearestFood.x, nearestFood.y);
        snake.boosting = nearestFoodDist > 80 && snake.length > 8;
        snake.aiState = 'hunt';
      } else {
        if (snake.aiTimer % 80 === 0) {
          snake.aiTarget = new Phaser.Math.Vector2(
            Phaser.Math.Between(100, this.worldSize - 100),
            Phaser.Math.Between(100, this.worldSize - 100)
          );
        }
        if (snake.aiTarget) {
          desiredAngle = Phaser.Math.Angle.Between(snake.head.x, snake.head.y, snake.aiTarget.x, snake.aiTarget.y);
        }
        snake.boosting = false;
        snake.aiState = 'wander';
      }

      // 避墙
      const margin = 200;
      if (snake.head.x < margin) desiredAngle = 0;
      if (snake.head.x > this.worldSize - margin) desiredAngle = Math.PI;
      if (snake.head.y < margin) desiredAngle = Math.PI / 2;
      if (snake.head.y > this.worldSize - margin) desiredAngle = -Math.PI / 2;

      // 简单避障射线
      const rayLen = 80;
      const offsets = [-0.4, -0.2, 0, 0.2, 0.4];
      let bestAngle = desiredAngle, bestScore = -Infinity;
      for (const off of offsets) {
        const testAngle = desiredAngle + off;
        const testX = snake.head.x + Math.cos(testAngle) * rayLen;
        const testY = snake.head.y + Math.sin(testAngle) * rayLen;
        let score = 100;
        if (testX < 0 || testX > this.worldSize || testY < 0 || testY > this.worldSize) score -= 500;
        for (const other of this.snakes) {
          if (other === snake || other.dead) continue;
          for (const seg of other.body.getChildren()) {
            if (Phaser.Math.Distance.Between(testX, testY, seg.x, seg.y) < 22) score -= 200;
          }
        }
        if (nearestFood) {
          const align = Math.cos(testAngle) * Math.cos(desiredAngle) + Math.sin(testAngle) * Math.sin(desiredAngle);
          score += align * 50;
        }
        if (score > bestScore) { bestScore = score; bestAngle = testAngle; }
      }
      snake.targetAngle = bestAngle;
    }
  }

  killSnake(snake) {
    if (snake.dead) return;
    snake.dead = true;
    snake.head.setVelocity(0, 0);
    snake.head.setVisible(false);

    // 身体变食物
    for (const seg of snake.body.getChildren()) {
      this.particles.emitParticleAt(seg.x, seg.y, 3);
      if (Math.random() < 0.4) {
        const f = this.physics.add.sprite(seg.x, seg.y, 'food').setDepth(2);
        f.setCircle(8);
        f.setTint(snake.color);
        const glow = this.add.circle(seg.x, seg.y, 12, snake.color, 0.2).setDepth(1);
        this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.05, duration: 1000, yoyo: true, repeat: -1 });
        f.setData('glow', glow);
        this.foods.add(f);
      }
      seg.destroy();
    }
    snake.body.clear(true, true);

    if (snake.isPlayer) {
      this.time.delayedCall(500, () => this.checkGameOver());
    }
  }

  checkGameOver() {
    if (this.player.dead) {
      const aliveAI = this.snakes.filter(s => !s.isPlayer && !s.dead).length;
      const rank = aliveAI + 1;
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', {
        score: Math.floor(this.player.length),
        kills: this.kills,
        rank: rank,
        total: this.snakes.length,
        won: aliveAI === 0 && !this.player.dead
      });
    } else {
      const aliveAI = this.snakes.filter(s => !s.isPlayer && !s.dead).length;
      if (aliveAI === 0) {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', {
          score: Math.floor(this.player.length),
          kills: this.kills,
          rank: 1,
          total: this.snakes.length,
          won: true
        });
      }
    }
  }
}
