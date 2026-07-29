class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    const makeTex = (key, color, glow, size = 64) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // 高分辨率纹理
      const r = size / 2;
      g.fillStyle(color, 1);
      g.fillCircle(r, r, r - 2);
      if (glow) {
        g.lineStyle(3, glow, 0.9);
        g.strokeCircle(r, r, r - 2);
      }
      g.generateTexture(key, size, size);
    };

    makeTex('snake-head', 0x00ffc8, 0x00ffc8, 64);
    makeTex('snake-body', 0x00b894, 0x00ffc8, 64);
    makeTex('ai-head-0', 0xff006e, 0xff006e, 64);
    makeTex('ai-body-0', 0xd63031, 0xff006e, 64);
    makeTex('ai-head-1', 0x8338ec, 0x8338ec, 64);
    makeTex('ai-body-1', 0x6c5ce7, 0x8338ec, 64);
    makeTex('ai-head-2', 0x3a86ff, 0x3a86ff, 64);
    makeTex('ai-body-2', 0x0984e3, 0x3a86ff, 64);
    makeTex('ai-head-3', 0xfb5607, 0xfb5607, 64);
    makeTex('ai-body-3', 0xe17055, 0xfb5607, 64);
    makeTex('ai-head-4', 0xffbe0b, 0xffbe0b, 64);
    makeTex('ai-body-4', 0xfab1a0, 0xffbe0b, 64);

    // 高分辨率食物
    const foodG = this.make.graphics({ x: 0, y: 0, add: false });
    foodG.fillStyle(0x00ffc8, 1);
    foodG.fillCircle(20, 20, 16);
    foodG.generateTexture('food', 40, 40);

    // 粒子
    const pG = this.make.graphics({ x: 0, y: 0, add: false });
    pG.fillStyle(0xffffff, 1);
    pG.fillCircle(6, 6, 6);
    pG.generateTexture('particle', 12, 12);

    // 网格
    const gridG = this.make.graphics({ x: 0, y: 0, add: false });
    gridG.lineStyle(1, 0x00ffc8, 0.04);
    for (let i = 0; i <= 100; i += 20) {
      gridG.moveTo(i, 0); gridG.lineTo(i, 100);
      gridG.moveTo(0, i); gridG.lineTo(100, i);
    }
    gridG.strokePath();
    gridG.generateTexture('grid', 100, 100);

    // 摇杆底座
    const joyBase = this.make.graphics({ x: 0, y: 0, add: false });
    joyBase.lineStyle(2, 0xffffff, 0.15);
    joyBase.fillStyle(0xffffff, 0.05);
    joyBase.fillCircle(60, 60, 60);
    joyBase.strokeCircle(60, 60, 60);
    joyBase.generateTexture('joy-base', 120, 120);

    // 摇杆按钮
    const joyStick = this.make.graphics({ x: 0, y: 0, add: false });
    joyStick.fillStyle(0x00ffc8, 0.6);
    joyStick.fillCircle(25, 25, 25);
    joyStick.generateTexture('joy-stick', 50, 50);

    this.scene.start('MenuScene');
  }
}
