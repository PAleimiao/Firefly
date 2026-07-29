class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  create(data) {
    this.gameScene = data.gameScene;

    // 分数面板
    this.scoreText = this.add.text(20, 20, '长度: 12', {
      fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#00ffc8',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 12, y: 6 }
    }).setDepth(100).setScrollFactor(0);

    this.killText = this.add.text(20, 55, '击杀: 0', {
      fontSize: '16px', fontFamily: 'Microsoft YaHei', color: '#ff006e',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 12, y: 6 }
    }).setDepth(100).setScrollFactor(0);

    // 小地图背景
    this.minimapBg = this.add.rectangle(this.cameras.main.width - 80, this.cameras.main.height - 80, 140, 140, 0x000000, 0.6)
      .setStrokeStyle(2, 0x00ffc8, 0.3).setDepth(100).setScrollFactor(0);

    // 排行榜
    this.lbBg = this.add.rectangle(this.cameras.main.width - 90, 100, 160, 200, 0x000000, 0.6)
      .setStrokeStyle(1, 0x00ffc8, 0.2).setDepth(100).setScrollFactor(0);
    this.add.text(this.cameras.main.width - 90, 30, '排行榜', {
      fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#00ffc8'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    this.lbTexts = [];
    for (let i = 0; i < 6; i++) {
      const t = this.add.text(this.cameras.main.width - 160, 55 + i * 22, '', {
        fontSize: '12px', fontFamily: 'Microsoft YaHei', color: '#aaa'
      }).setDepth(100).setScrollFactor(0);
      this.lbTexts.push(t);
    }

    // 操作提示
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 30, 'WASD移动 | 空格加速', {
      fontSize: '13px', fontFamily: 'Microsoft YaHei', color: '#555'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // 小地图点
    this.minimapDots = [];

    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize) {
    const w = gameSize.width, h = gameSize.height;
    this.minimapBg.setPosition(w - 80, h - 80);
    this.lbBg.setPosition(w - 90, 100);
  }

  update() {
    if (!this.gameScene || !this.gameScene.player) return;

    const player = this.gameScene.player;
    this.scoreText.setText(`长度: ${Math.floor(player.length)}`);
    this.killText.setText(`击杀: ${this.gameScene.kills}`);

    // 排行榜
    const alive = this.gameScene.snakes.filter(s => !s.dead).sort((a, b) => b.length - a.length);
    for (let i = 0; i < 6; i++) {
      if (i < alive.length) {
        const s = alive[i];
        const color = s.isPlayer ? '#00ffc8' : '#aaa';
        this.lbTexts[i].setText(`${i + 1}. ${s.name}  ${Math.floor(s.length)}`);
        this.lbTexts[i].setColor(color);
      } else {
        this.lbTexts[i].setText('');
      }
    }

    // 小地图
    const mmX = this.minimapBg.x - 60, mmY = this.minimapBg.y - 60;
    const scale = 120 / this.gameScene.worldSize;

    // 清除旧点
    for (const dot of this.minimapDots) dot.destroy();
    this.minimapDots = [];

    // 绘制食物
    for (const f of this.gameScene.foods.getChildren()) {
      const dot = this.add.rectangle(mmX + f.x * scale, mmY + f.y * scale, 1.5, 1.5, 0x00ffc8, 0.3)
        .setDepth(101).setScrollFactor(0);
      this.minimapDots.push(dot);
    }

    // 绘制蛇
    for (const s of this.gameScene.snakes) {
      if (s.dead) continue;
      const color = s.isPlayer ? 0x00ffc8 : s.color;
      const size = s.isPlayer ? 3 : 2;
      const dot = this.add.rectangle(mmX + s.head.x * scale, mmY + s.head.y * scale, size, size, color, 1)
        .setDepth(102).setScrollFactor(0);
      this.minimapDots.push(dot);
    }

    // 视野框
    const cam = this.gameScene.cameras.main;
    const vw = cam.width * scale / cam.zoom;
    const vh = cam.height * scale / cam.zoom;
    const frame = this.add.rectangle(mmX + cam.scrollX * scale + vw/2, mmY + cam.scrollY * scale + vh/2, vw, vh)
      .setStrokeStyle(1, 0xffffff, 0.3).setDepth(103).setScrollFactor(0);
    this.minimapDots.push(frame);
  }
}
