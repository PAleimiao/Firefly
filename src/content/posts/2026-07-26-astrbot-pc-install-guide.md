---
title: "AstrBot 电脑版安装使用指南：从部署到接入AI，一条龙教程"
published: 2026-07-26
description: "从 0 开始部署 AstrBot + NapCat，接入 QQ 与 AI 大模型，覆盖 Docker / 手动 / Windows / 宝塔 / Arch 多种部署方式"
tags: [教程, AstrBot, QQ机器人, AI, 大模型, 电脑, 部署, NapCat]
category: 教程
slug: astrbot-pc-install-guide
image: ./images/astrbot-architecture.png
---

> 本文最后更新于 2026-07-26，基于 AstrBot 最新稳定版编写。  
> 如果你跟着步骤走还是踩坑了，欢迎截图甩我，随叫随到 ( •̀ ω •́ )✧

<!-- more -->

## 一、AstrBot 是啥？能干啥？

**AstrBot** 是一个开源的一站式 Agent 聊天机器人平台，说人话就是：  
你把 AI 大模型（DeepSeek、GPT、Gemini 啥的）接进去，它就能帮你在 **QQ、QQ频道、Telegram、微信、飞书、钉钉** 这些平台上自动回复消息。

**电脑版 vs 手机版？**

| 对比项 | 电脑版（本文） | 手机版 |
|--------|-------------|--------|
| 运行环境 | 服务器 / VPS / 本地电脑 | Termux / 随身设备 |
| 稳定性 | 7×24 挂机，稳如老狗 | 随手机休眠可能掉线 |
| 性能 | 能跑大模型，插件随便装 | 轻量，适合尝鲜 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**结论**：想正经用、长期用、群聊里当管理员的，直接上电脑版/服务器版，别折腾手机 (￣▽￣)"

---

## 二、准备工作

动手之前先把这几样凑齐，省得中途卡壳：

1. **一台能联网的机器**
   - 可以是家里电脑、笔记本、VPS、云服务器
   - 配置要求：**2核1G内存**就能跑，推荐 2核2G 更丝滑
   - 系统：Ubuntu 22.04 / Debian 12 / Windows 10+ / Arch Linux 都行

2. **一个 QQ 小号**
   - **千万别用主号！** 机器人有一定封号风险，用小号隔离
   - 建议用养了几个月、有正常使用记录的号，新号容易被风控

3. **一个 AI 模型的 API Key**
   - 推荐 **硅基流动（SiliconCloud）**：国内直连，送代金券，支持 DeepSeek-V3、Qwen3、GLM-4 等
   - 或者你有 OpenAI、DeepSeek 官方、Gemini 的 Key 也行

4. **手机 QQ**
   - 用来扫码登录 NapCat，登录一次就行，之后机器人自己挂机

---

## 三、部署方式总览

AstrBot 现在支持 N 种部署方式，挑一个适合你的：

| 方式 | 难度 | 适合人群 | 推荐度 |
|------|------|---------|--------|
| **Docker Compose** | 简单 | 有服务器的所有人 | ⭐⭐⭐⭐⭐ |
| **uv 手动部署** | 中等 | 想改源码、玩二次开发 | ⭐⭐⭐⭐ |
| **Windows 一键安装器** | 超简单 | 纯小白，只用 Windows | ⭐⭐⭐⭐ |
| **宝塔 / 1Panel** | 简单 | 已有面板环境 | ⭐⭐⭐⭐ |
| **Arch Linux AUR** | 中等 | Arch 用户 (懂的都懂) | ⭐⭐⭐ |

下面逐个展开，**推荐直接看方式一 Docker**，五分钟搞定。

---

## 四、方式一：Docker Compose 部署（强烈推荐）

### 4.1 安装 Docker

如果你还没装 Docker，先整上：

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker

# 验证
docker --version
docker compose version
```

国内机器拉镜像可能慢，建议配个加速源：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.xuanyuan.me",
    "https://docker.hlmirror.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 4.2 一键拉起 AstrBot + NapCat

官方提供了现成的 Compose 文件，AstrBot 和 NapCat 一起跑，省去单独配置的麻烦：

```bash
mkdir astrbot && cd astrbot
wget https://raw.githubusercontent.com/NapNeko/NapCat-Docker/main/compose/astrbot.yml
sudo docker compose -f astrbot.yml up -d
```

> 如果 `wget` 拉不下来（GitHub 抽风），手动创建 `astrbot.yml` 文件，内容如下：

```yaml
version: '3.8'
services:
  astrbot:
    image: soulter/astrbot:latest
    container_name: astrbot
    ports:
      - "6185:6185"
      - "6199:6199"
      - "11451:11451"
    volumes:
      - ./data:/AstrBot/data
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped

  napcat:
    image: mlikiowa/napcat-docker:latest
    container_name: napcat
    ports:
      - "3000:3000"
      - "3001:3001"
      - "6099:6099"
    environment:
      - NAPCAT_GID=0
      - NAPCAT_UID=0
    restart: unless-stopped
```

国内机器把镜像前缀改成加速源，比如 `m.daocloud.io/docker.io/soulter/astrbot:latest`。

### 4.3 查看状态

```bash
# 看 AstrBot 日志
sudo docker logs -f astrbot

# 看 NapCat 日志（里面会有 WebUI 地址和 Token）
sudo docker logs -f napcat
```

看到 AstrBot 日志输出「管理面板已启动」就算成功了。

### 4.4 登录 WebUI

浏览器打开：`http://你的服务器IP:6185`

- 默认账号：`astrbot`
- 默认密码：`astrbot`
- **首次登录会强制要求改密码**，改完才能进面板 (ﾉ*･ω･)ﾉ

NapCat 的 WebUI：`http://服务器IP:6099`，Token 看上面 `docker logs napcat` 的输出。

---

## 五、方式二：uv 手动部署（适合爱折腾的）

如果你不想用 Docker，或者想改源码二次开发，用 `uv` 部署最清爽。

### 5.1 安装 uv

```bash
pip install uv
# 或者
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 5.2 克隆并运行

```bash
git clone https://github.com/AstrBotDevs/AstrBot.git
cd AstrBot
uv run main.py
```

或者更简洁：

```bash
mkdir astrbot && cd astrbot
uvx astrbot init
uvx astrbot run
```

跑起来后同样访问 `http://localhost:6185`。

---

## 六、方式三：Windows 一键安装器

纯 Windows 用户，直接去 GitHub Releases 下载 **AstrBot Launcher**：

👉 https://github.com/Soulter/AstrBotLauncher/releases

下载 `.exe` 安装器，双击运行，跟着向导点下一步就行，全程图形界面，比安装 QQ 还简单 (｡･ω･｡)

---

## 七、方式四：宝塔 / 1Panel 面板部署

如果你服务器上已经装了宝塔或 1Panel，直接搜「AstrBot」一键安装：

- **宝塔**：应用商店 → 搜索 AstrBot → 安装
- **1Panel**：应用商店 → 搜索 AstrBot → 安装

装完后面板里会显示访问地址和端口，点进去就完事了。

---

## 八、方式五：Arch Linux AUR（Arch 用户专属）

```bash
yay -S astrbot-git
# 或者
paru -S astrbot-git
```

装完直接 `astrbot` 启动，AUR 会帮你把依赖全搞定。

---

## 九、NapCat 配置 & QQ 登录

不管你用哪种方式，NapCat 的配置逻辑都一样。

### 9.1 进入 NapCat WebUI

浏览器打开 `http://服务器IP:6099`，输入 Token（看 `docker logs napcat`）。

### 9.2 扫码登录 QQ

1. 点「网络配置」→ 左侧菜单
2. 选择「扫码登录」
3. 掏出手机，用你准备好的 **QQ 小号** 扫码
4. 看到「登录成功」就稳了

> ⚠️ **重要提醒**：
> - 扫码时手机和服务器网络别差太远，不然可能超时
> - 登录成功后 **别在小号手机上退出登录**，否则机器人会掉线
> - 如果提示风控，换号重试，新号很容易死

### 9.3 配置 WebSocket 客户端

登录成功后，在 NapCat WebUI 里：

1. 左侧「网络配置」→ 点击「新建」
2. 选择 **WebSocket 客户端**
3. 填写参数：
   - **名称**：随便填，比如 `astrbot`
   - **URL**：`ws://你的服务器IP:6199/ws`  
     （⚠️ 注意末尾必须有 `/ws`，少了连不上！）
   - **消息格式**：`Array`
   - **心跳间隔**：`5000`
   - **重连间隔**：`5000`
   - **Token**：设一个强密码，比如 `YourStrongToken123!`
4. 保存

---

## 十、AstrBot 接入 NapCat

NapCat 那边配好了，现在去 AstrBot 面板对接：

1. 打开 `http://服务器IP:6185`，登录
2. 左侧「消息平台」→ 「新增适配器」
3. 选择 **「接入 QQ 个人号（aiocqhttp）」**
4. 填写参数：
   - **反向 WebSocket 主机地址**：`0.0.0.0`
   - **端口**：`6199`
   - **Token**：填和 NapCat 那边**一模一样**的密码
5. 保存 → 重启 AstrBot

重启后盯着日志，看到蓝色的 **「aiocqhttp(OneBot v11) 适配器已连接」** 就说明两边握手成功了 🤝

**验证方式**：拿另一个 QQ 号私聊你的机器人，发 `/help`，有回复就全搞定了！

---

## 十一、接入 AI 大模型（给机器人装大脑）

机器人能收发消息了，但还没接 AI，现在来装大脑。

### 11.1 推荐：硅基流动（国内直连，便宜好用）

1. 打开 https://cloud.siliconflow.cn 注册（邀请码可以填别人的，有代金券）
2. 左侧「API 密钥」→ 「新建 API 密钥」→ 复制密钥
3. 回到 AstrBot 面板 → 「大语言模型」→ 「新增」
4. 选择 **「硅基流动」** 或手动选 OpenAI 格式
5. 填写：
   - **API Base URL**：`https://api.siliconflow.cn/v1`
   - **API Key**：粘贴你刚复制的密钥
   - **模型名**：`deepseek-ai/DeepSeek-V3`（或 `Qwen/Qwen3-32B`、`THUDM/glm-4-9b-chat` 等）
6. 保存

### 11.2 其他模型接入

| 平台 | API Base URL | 模型名示例 |
|------|-------------|-----------|
| DeepSeek 官方 | `https://api.deepseek.com/v1` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-1.5-pro` |
| 月之暗面 | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| Ollama 本地 | `http://localhost:11434/v1` | `llama3` |

> 接 Ollama 本地模型的话，确保 Ollama 已经跑起来并且模型已下载。

保存后去「对话管理」页面，能看到实时对话记录，方便调试。

---

## 十二、插件扩展（让机器人更骚）

AstrBot 支持插件市场，一键安装：

1. AstrBot 面板 → 「插件」→ 「插件市场」
2. 挑喜欢的点「安装」，比如：
   - **群管插件**：自动禁言、踢人、关键词过滤
   - **图片生成**：接 Stable Diffusion 画图
   - **联网搜索**：让 AI 能查百度/谷歌
   - **长期记忆**：让机器人记住群友的喜好
3. 装完重启 AstrBot 生效

想自己写插件？AstrBot 用 Python 写插件，文档看官方 Wiki，有手就行 (ง •_•)ง

---

## 十三、常见问题排查（踩坑大全）

### Q1：AstrBot 启动失败 / 端口被占用

```bash
# 看端口占用
sudo lsof -i :6185
sudo lsof -i :6199

# 杀掉占用进程，或者改 AstrBot 端口
```

### Q2：NapCat 连不上 AstrBot，日志报 connection refused

- 检查防火墙/安全组是否放行了 6199 端口
- 检查 URL 末尾是否有 `/ws`
- 检查两边 Token 是否完全一致
- 如果是 Docker，检查容器是否在同一个网络：`docker network ls`

### Q3：QQ 扫码后秒掉线 / 被封号

- 换号！新号必死，用老号
- 别用刚注册的 QQ
- 登录后别在手机上点「退出登录」，要点「隐身」或「切换账号」

### Q4：机器人回复很慢 / 没反应

- 检查 AI 模型 API Key 是否欠费
- 检查网络能不能连到 API Base URL
- 看 AstrBot 日志有没有报错
- 如果是本地模型，检查显卡/内存是否吃满

### Q5：Windows Defender 报毒 / 拦截

- AstrBot 和 NapCat 都是开源的，没毒，放心加白名单
- Windows 安全中心 → 病毒和威胁防护 → 排除项 → 添加 AstrBot 文件夹

### Q6：怎么 24 小时挂机？

- **Docker**：已经配了 `restart: unless-stopped`，服务器重启会自动拉起
- **手动部署**：用 `systemd` 或 `pm2` 守护进程：
  ```bash
  # pm2 方式
  npm install -g pm2  # 先装 pm2
  pm2 start "uv run main.py" --name astrbot
  pm2 save
  pm2 startup
  ```

### Q7：想换 AI 模型怎么办？

AstrBot 支持多模型并发，在「大语言模型」里新增另一个提供商，然后在「对话管理」里切换即可，不用删旧的。

---

## 十四、总结：四步搞定

懒得看上面长篇大论？记住这四步：

1. **跑起来**：Docker Compose 一键拉起 AstrBot + NapCat
2. **登 QQ**：NapCat 扫码登录小号
3. **连起来**：NapCat WebSocket 客户端 → AstrBot aiocqhttp 适配器
4. **接 AI**：填 API Key，选模型，开聊

完事儿！去群里 @ 你的机器人试试效果吧 ヽ(✿ﾟ▽ﾟ)ノ

---

> **延伸阅读**
> - AstrBot 官方文档：https://docs.astrbot.app
> - AstrBot GitHub：https://github.com/AstrBotDevs/AstrBot
> - NapCat 文档：https://napcat.napneko.icu
> - 硅基流动：https://cloud.siliconflow.cn
