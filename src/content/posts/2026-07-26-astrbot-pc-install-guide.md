---
title: AstrBot 电脑版安装使用指南：从部署到接入AI，一条龙教程
published: 2026-07-26
description: 手机版AstrBot写过了，这篇补电脑版。Windows/Linux/Mac全平台支持，从安装Python到接入DeepSeek，看完直接拥有一个24小时在线的QQ机器人。
tags: [教程, AstrBot, QQ机器人, AI, 大模型, 电脑, 部署]
category: 教程
slug: astrbot-pc-install-guide
image: ./images/astrbot-architecture.png
---

> 手机版AstrBot写过了，但很多人还是想在电脑上跑——更稳、更快、能同时挂多个平台。
> 这篇就是电脑版的完整指南，Windows/Linux/Mac 都能用。

<!-- more -->

---

## 一、AstrBot 是什么？能干嘛？

**AstrBot** 是一个开源的 QQ/微信/飞书 机器人框架，核心功能是：

- 接入 AI 大模型（DeepSeek、OpenAI、Gemini、Claude 等）
- 让机器人能看懂群聊上下文，智能回复
- 支持插件扩展（天气查询、翻译、群管、签到等）
- 支持多平台同时登录（QQ + 微信 + 飞书）

**电脑版 vs 手机版区别：**

| 对比项 | 电脑版 | 手机版 |
|--------|--------|--------|
| 稳定性 | 高，24小时挂机 | 中，容易被杀后台 |
| 性能 | 能跑大模型本地部署 | 只能接API |
| 多开 | 支持多平台同时登录 | 一般只跑QQ |
| 插件 | 全部可用 | 部分受限 |
| 适合人群 | 有电脑/服务器 | 只有手机 |

---

## 二、准备工作

你需要：
1. 一台电脑（Windows 10+/Linux/macOS）
2. Python 3.10+（必须，AstrBot 基于 Python）
3. 一个 QQ 小号（别用大号，封号风险自负）
4. 一个大模型 API Key（DeepSeek/OpenAI 等，没有就是复读机）
5. **带脑子**（最重要）

---

## 三、Step 1：安装 Python

### Windows

1. 打开 [python.org](https://www.python.org/downloads/)
2. 下载最新版 Python 3.11 或 3.12
3. 安装时**勾选「Add Python to PATH」**，必须勾！
4. 点 Install Now，等装完

验证安装：
```bash
python --version
pip --version
```

如果显示版本号，说明装好了。

### Linux（Ubuntu/Debian）

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv -y
```

### macOS

```bash
brew install python
```

---

## 四、Step 2：安装 AstrBot

### 方式A：一键脚本（推荐，最简单）

Windows 打开 PowerShell，Linux/macOS 打开终端：

```bash
# 克隆仓库
git clone https://github.com/AstrBotDevs/AstrBot.git
cd AstrBot

# 创建虚拟环境（隔离依赖，防止冲突）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 方式B：pip 直接安装（适合进阶用户）

```bash
pip install astrbot
```

> 方式B装的是核心库，配置文件和插件需要手动创建，新手建议用方式A。

---

## 五、Step 3：配置 NapCat（QQ协议端）

AstrBot 本身不直接连 QQ，需要 **NapCat** 做中间人。

### 安装 NapCat

```bash
# 下载 NapCat（以 Windows 为例）
# 去 GitHub Release 下载最新版：https://github.com/NapNeko/NapCat-Win
# 解压到任意文件夹
```

Linux 一键安装：
```bash
curl -o napcat.sh https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh
bash napcat.sh --docker n --cli y --force
```

### 启动 NapCat 并登录QQ

```bash
# Windows 双击 napcat.exe
# Linux:
napcat start 你的QQ号
```

启动后会显示**二维码**，用手机 QQ 扫码登录。

登录成功后，NapCat 会启动一个 WebUI，地址是 `http://localhost:6099`。

---

## 六、Step 4：连接 AstrBot 和 NapCat

### 6.1 启动 AstrBot

在 AstrBot 目录下（虚拟环境已激活）：

```bash
python main.py
```

第一次启动会生成默认配置，然后自动退出，提示你去改配置。

### 6.2 修改配置

打开 `AstrBot/data/config.json` 或 `AstrBot/config.yaml`（取决于版本），找到平台配置：

```yaml
platform:
  - type: qq
    enable: true
    adapter: napcat
    host: 127.0.0.1
    port: 6099
    token: "你的NapCat WebUI Token"
```

**Token 怎么获取？**

1. 打开 NapCat WebUI：`http://localhost:6099/webui`
2. 用初始 Token 登录（查看命令：`cat ~/Napcat/config/webui.json | grep token`）
3. 左侧 → **「网络配置」→「新建」→「WebSocket Client」**
4. URL 填 `ws://127.0.0.1:6199/ws`
5. Token 随便设一个（两边要一致）
6. 消息格式选 `Array`
7. 保存并启用

然后在 AstrBot 配置里填同样的 Token。

### 6.3 配置大模型

在 AstrBot 配置文件里找到 provider 部分：

```yaml
provider:
  - type: openai
    enable: true
    api_key: "你的API Key"
    base_url: "https://api.deepseek.com/v1"  # 如果用DeepSeek
    model: "deepseek-chat"
```

**支持的模型：**
- DeepSeek：`base_url: https://api.deepseek.com/v1`，`model: deepseek-chat`
- OpenAI：`base_url: https://api.openai.com/v1`，`model: gpt-4o`
- Gemini：`base_url: https://generativelanguage.googleapis.com`，`model: gemini-pro`

没有 API Key？去对应官网注册，新用户一般有免费额度。

### 6.4 重新启动

```bash
python main.py
```

看到日志显示「QQ 适配器已连接」「大模型提供商已加载」，说明搞定！

---

## 七、Step 5：测试机器人

用另一个 QQ 号给机器人发消息：

- `/help` — 查看命令列表
- 直接聊天 — 测试 AI 回复
- `@机器人 你好` — 测试群聊回复

如果机器人回复了，说明全流程打通！

---

## 八、进阶：插件 & 功能扩展

AstrBot 支持插件扩展，官方插件市场有：

- **群管插件**：禁言、踢人、关键词屏蔽
- **签到插件**：每日签到、积分系统
- **天气插件**：查询城市天气
- **翻译插件**：多语言翻译
- **图片生成**：接入 Stable Diffusion

安装插件：
```bash
# 在 AstrBot 控制台或配置文件里启用
# 部分插件需要额外依赖，按提示安装即可
```

---

## 九、常见问题

**Q：NapCat 启动失败？**
> 检查 QQ 版本，NapCat 需要特定版本的 QQNT。去 NapCat GitHub 看兼容版本说明。

**Q：AstrBot 连不上 NapCat？**
> 检查 Token 是否一致，端口是否正确，防火墙是否放行 6099/6199。

**Q：AI 回复很慢？**
> 看你接的什么模型。免费 API 通常慢，本地部署的 Ollama 看显卡性能。

**Q：封号了怎么办？**
> 用小号就是为了防这个。降低发言频率，别在群里刷屏，别发敏感内容。

**Q：想24小时挂机？**
> Windows 用「任务计划程序」或 NSSM 做成服务。Linux 用 systemd 或 screen/tmux。

---

## 十、总结

电脑版 AstrBot 的核心流程就四步：

1. **装 Python** → 环境基础
2. **装 AstrBot + NapCat** → 机器人和QQ连接器
3. **改配置** → 连QQ、接AI、设Token
4. **启动测试** → 发消息验证

比手机版稳得多，适合长期挂机、多平台同时登录、跑复杂插件。

> 如果你看完这篇还是不会，建议直接复制粘贴命令，报错截图发我，或者……回去看B站龙虾的视频版教程。

---

*P.S. 本文基于 AstrBot v3.x + NapCat v2.x，如果后续版本配置格式有变，大体逻辑应该差不多。*

*P.P.S. 感谢B站UP主「龙虾」的视频教程启发，视频版更直观，文字版更适合边操作边查。*
