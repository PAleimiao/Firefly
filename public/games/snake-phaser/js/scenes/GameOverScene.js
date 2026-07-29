class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data) {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    // 背景
    this.cameras.main.setBackgroundColor('rgba(5,5,16,0.95)');
    this.cameras.main.fadeIn(300);

    // 标题
    const title = data.won ? '冠军！' : '游戏结束';
    const titleColor = data.won ? '#00ffc8' : '#ff006e';
    this.add.text(cx, cy - 140, title, {
      fontSize: '56px', fontFamily: 'Microsoft YaHei', color: titleColor,
      stroke: titleColor, strokeThickness: 2
    }).setOrigin(0.5);

    // 数据
    this.add.text(cx, cy - 50, `最终长度: ${data.score}`, {
      fontSize: '22px', fontFamily: 'Microsoft YaHei', color: '#fff'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, `击杀数: ${data.kills}`, {
      fontSize: '20px', fontFamily: 'Microsoft YaHei', color: '#ff006e'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 30, `排名: 第 ${data.rank} 名 / ${data.total} 人`, {
      fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#888'
    }).setOrigin(0.5);

    // 再来一局
    const btn = this.add.rectangle(cx, cy + 100, 200, 48, 0x00ffc8, 0.1)
      .setStrokeStyle(2, 0x00ffc8, 0.5).setInteractive();
    this.add.text(cx, cy + 100, '再来一局', {
      fontSize: '18px', fontFamily: 'Microsoft YaHei', color: '#00ffc8'
    }).setOrigin(0.5);

    btn.on('pointerover', () => { btn.setFillStyle(0x00ffc8, 0.2); btn.setScale(1.05); });
    btn.on('pointerout', () => { btn.setFillStyle(0x00ffc8, 0.1); btn.setScale(1); });
    btn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    // 返回
    const back = this.add.rectangle(cx, cy + 170, 160, 38, 0xffffff, 0.03)
      .setStrokeStyle(1, 0xffffff, 0.2).setInteractive();
    this.add.text(cx, cy + 170, '返回游戏站', {
      fontSize: '14px', fontFamily: 'Microsoft YaHei', color: '#aaa'
    }).setOrigin(0.5);
    back.on('pointerdown', () => window.location.href = '../index.html');
  }
}
