class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    // 背景粒子
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const p = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0x00ffc8, 0.3);
      this.tweens.add({
        targets: p, y: y - 100, alpha: 0, duration: 3000 + Math.random() * 2000,
        repeat: -1, delay: Math.random() * 2000
      });
    }

    // 标题
    this.add.text(cx, cy - 120, '霓虹蛇域', {
      fontSize: '64px', fontFamily: 'Microsoft YaHei', color: '#00ffc8',
      stroke: '#00ffc8', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0.9);

    this.add.text(cx, cy - 50, 'SNAKE BATTLE ROYALE', {
      fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#666',
      letterSpacing: 6
    }).setOrigin(0.5);

    // 说明
    const info = [
      'WASD / 方向键 移动',
      '空格键 加速（消耗长度）',
      '你 vs 5条高智商AI蛇',
      '撞墙或撞蛇身即死'
    ];
    info.forEach((line, i) => {
      this.add.text(cx, cy + 20 + i * 28, line, {
        fontSize: '15px', fontFamily: 'Microsoft YaHei', color: '#888'
      }).setOrigin(0.5);
    });

    // 开始按钮
    const btn = this.add.rectangle(cx, cy + 180, 220, 50, 0x00ffc8, 0.1)
      .setStrokeStyle(2, 0x00ffc8, 0.5).setInteractive();
    const btnText = this.add.text(cx, cy + 180, '开始游戏', {
      fontSize: '20px', fontFamily: 'Microsoft YaHei', color: '#00ffc8'
    }).setOrigin(0.5);

    btn.on('pointerover', () => { btn.setFillStyle(0x00ffc8, 0.2); btn.setScale(1.05); });
    btn.on('pointerout', () => { btn.setFillStyle(0x00ffc8, 0.1); btn.setScale(1); });
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 5, 5, 16);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });

    // 返回按钮
    const backBtn = this.add.rectangle(cx, cy + 250, 180, 40, 0xffffff, 0.03)
      .setStrokeStyle(1, 0xffffff, 0.1).setInteractive();
    this.add.text(cx, cy + 250, '返回游戏站', {
      fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#aaa'
    }).setOrigin(0.5);
    backBtn.on('pointerover', () => backBtn.setStrokeStyle(1, 0x00ffc8, 0.4));
    backBtn.on('pointerout', () => backBtn.setStrokeStyle(1, 0xffffff, 0.1));
    backBtn.on('pointerdown', () => window.location.href = '../index.html');
  }
}
