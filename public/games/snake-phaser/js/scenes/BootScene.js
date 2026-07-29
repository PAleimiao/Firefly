class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    // 程序生成蛇身纹理
    const makeSnakeTexture = (key, color, glow) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1);
      g.fillCircle(16, 16, 14);
      if (glow) {
        g.lineStyle(2, glow, 0.8);
        g.strokeCircle(16, 16, 14);
      }
      g.generateTexture(key, 32, 32);
    };

    makeSnakeTexture('snake-head', 0x00ffc8, 0x00ffc8);
    makeSnakeTexture('snake-body', 0x00b894, 0x00ffc8);
    makeSnakeTexture('ai-head-0', 0xff006e, 0xff006e);
    makeSnakeTexture('ai-body-0', 0xd63031, 0xff006e);
    makeSnakeTexture('ai-head-1', 0x8338ec, 0x8338ec);
    makeSnakeTexture('ai-body-1', 0x6c5ce7, 0x8338ec);
    makeSnakeTexture('ai-head-2', 0x3a86ff, 0x3a86ff);
    makeSnakeTexture('ai-body-2', 0x0984e3, 0x3a86ff);
    makeSnakeTexture('ai-head-3', 0xfb5607, 0xfb5607);
    makeSnakeTexture('ai-body-3', 0xe17055, 0xfb5607);
    makeSnakeTexture('ai-head-4', 0xffbe0b, 0xffbe0b);
    makeSnakeTexture('ai-body-4', 0xfab1a0, 0xffbe0b);

    // 食物纹理
    const foodG = this.make.graphics({ x: 0, y: 0, add: false });
    foodG.fillStyle(0x00ffc8, 1);
    foodG.fillCircle(10, 10, 8);
    foodG.generateTexture('food', 20, 20);

    // 粒子纹理
    const pG = this.make.graphics({ x: 0, y: 0, add: false });
    pG.fillStyle(0xffffff, 1);
    pG.fillCircle(4, 4, 4);
    pG.generateTexture('particle', 8, 8);

    // 网格背景
    const gridG = this.make.graphics({ x: 0, y: 0, add: false });
    gridG.lineStyle(1, 0x00ffc8, 0.05);
    for (let i = 0; i <= 100; i += 20) {
      gridG.moveTo(i, 0); gridG.lineTo(i, 100);
      gridG.moveTo(0, i); gridG.lineTo(100, i);
    }
    gridG.strokePath();
    gridG.generateTexture('grid', 100, 100);

    this.scene.start('MenuScene');
  }
}
