---
title: "AstrBot 电脑版安装使用指南：从部署到接入AI，一条龙教程"
published: 2026-07-26
description: "从 0 开始部署 AstrBot，覆盖 CasaOS 物理机 / Docker / 手动 / Windows / 宝塔 / Arch 全平台部署，含 QQ 接入、Ollama 本地模型、知识库、插件等完整配置"
tags: [教程, AstrBot, QQ机器人, AI, 大模型, 电脑, 部署, NapCat, CasaOS, Ollama]
category: 教程
slug: astrbot-pc-install-guide
image: ./images/astrbot-architecture.png
---

> 本文最后更新于 2026-07-26，基于 AstrBot 最新稳定版及官方视频教程整理。  
> 如果你跟着步骤走还是踩坑了，欢迎截图甩我，随叫随到 ( •̀ ω •́ )✧

<!-- more -->

---

## 一、AstrBot 是啥？能干啥？

**AstrBot** 是一个开源的一站式 Agent 聊天机器人平台，说人话就是：你把 AI 大模型（DeepSeek、GPT、Gemini 啥的）接进去，它就能帮你在 **QQ、QQ频道、微信、Telegram、飞书、钉钉、Discord** 这些平台上自动回复消息。

![AstrBot 官网首页，展示跨平台 AI 助手功能](./images/astrbot-official-site.png)

它不只是聊天机器人，更是 Agent 平台：支持子代理（Sub-Agent）协同工作、复杂任务编排、工具调用与上下文管理，让 AI 具备真正的行动力。

**电脑版 vs 手机版？**

| 对比项 | 电脑版（本文） | 手机版 |
|--------|-------------|--------|
| 运行环境 | 服务器 / VPS / 本地电脑 / NAS | Termux / 随身设备 |
| 稳定性 | 7×24 挂机，稳如老狗 | 随手机休眠可能掉线 |
| 性能 | 能跑大模型，插件随便装 | 轻量，适合尝鲜 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**结论**：想正经用、长期用、群聊里当管理员的，直接上电脑版/服务器版，别折腾手机 (￣▽￣)"

---

## 二、准备工作

动手之前先把这几样凑齐，省得中途卡壳：

### 2.1 硬件与软件准备（物理机部署）

如果你打算用家里闲置电脑或工控机当服务器，需要准备以下东西：

![硬件与软件准备清单：X86电脑、U盘、BalenaEtcher、MobaXterm、Ubuntu镜像、大模型API](./images/astrbot-hardware-prep.png)

- **X86 电脑**（台式机/笔记本/小主机都行，ARM 也可以但视频里演示的是 X86）
- **U 盘**（≥8GB，用来写 Ubuntu 系统镜像）
- **BalenaEtcher**：把 Ubuntu 镜像写入 U 盘的工具  
  👉 https://etcher.balena.io
- **MobaXterm**：Windows 下的 SSH 连接工具（比 PuTTY 好用一百倍）  
  👉 https://mobaxterm.mobatek.net
- **Ubuntu 镜像**：推荐 **Ubuntu 24.04 LTS**  
  👉 https://ubuntu.com/download/desktop
- **大模型 API Key**：推荐 **硅基流动（SiliconCloud）** 或 **MiniMax**、**DeepSeek** 等
- **一个 QQ 小号**：**千万别用主号！** 机器人有一定封号风险，用小号隔离。建议用养了几个月、有正常使用记录的号，新号容易被风控。

### 2.2 如果你用云服务器/VPS

那硬件和系统安装这一步可以跳过，直接看「方式二：Docker Compose」或「方式三：CasaOS」。

---

## 三、方式一：物理机 + CasaOS 部署（视频主打方式）

视频里 UP 主演示的是：拿一台闲置小主机，装 Ubuntu → 装 CasaOS → 应用商店一键装 AstrBot。这种方式最适合家里有闲置电脑、想搭 NAS + 机器人一体机的兄弟。

### 3.1 制作 Ubuntu 启动盘

1. 下载 BalenaEtcher 和 Ubuntu 24.04 ISO 镜像
2. 打开 BalenaEtcher → 「从文件烧录」→ 选择 Ubuntu ISO → 选择你的 U 盘 → 「现在烧录！」

![BalenaEtcher 软件界面，选择镜像文件和目标U盘进行烧录](./images/astrbot-balenaetcher.png)

3. 烧录完成后，把 U 盘插到要装系统的电脑上

### 3.2 安装 Ubuntu 系统

1. 开机按 **F12/F2/Del**（不同主板按键不同）进入 BIOS，选择 U 盘启动
2. 进入 Ubuntu 安装界面，语言选 **中文（简体）**
3. 键盘布局默认，网络连接建议插网线自动连上
4. 选择「**正常安装**」，勾选「**安装第三方软件**」（为了显卡驱动和 WiFi 驱动）
5. 安装类型选「**擦除磁盘并安装 Ubuntu**」——⚠️ **注意这会清空硬盘所有数据，别选错了！**
6. 时区默认 **上海（Shanghai, China）**
7. 创建用户：填用户名、密码，**记住这个密码，后面 SSH 登录要用**
8. 等进度条跑完，重启，拔掉 U 盘

![Ubuntu 24.04 安装欢迎界面，选择语言和键盘布局](./images/astrbot-ubuntu-install.png)

### 3.3 安装 OpenSSH + 查看 IP

开机进入 Ubuntu 桌面后，打开终端：

```bash
sudo apt install openssh-server -y
ip addr
```

![Ubuntu 终端中安装 OpenSSH 服务](./images/astrbot-ssh-install.png)

找到类似 `192.168.31.226` 这样的内网 IP，记下来。

### 3.4 SSH 远程连接（MobaXterm）

1. 打开 MobaXterm → 「Session」→ 「SSH」
2. Remote host 填刚才的 IP（如 `192.168.31.226`）
3. Username 填你创建的用户名
4. 点 OK，输入密码，连上！

![MobaXterm 软件界面，配置 SSH 远程连接](./images/astrbot-mobaxterm.png)

### 3.5 换国内软件源（加速下载）

Ubuntu 默认源在国外，下载慢得离谱。用 **LinuxMirrors** 一键换源：

```bash
bash <(curl -sSL https://linuxmirrors.cn/main.sh)
```

![LinuxMirrors 换源脚本在终端中运行，选择国内镜像站](./images/astrbot-linuxmirrors.png)

脚本会让你选择镜像站，推荐选：
- **清华大学**（tuna）
- **阿里云**（aliyun）
- **中科大**（ustc）

选完回车，自动完成换源。

### 3.6 安装 CasaOS

CasaOS 是一个轻量级 NAS 系统，自带应用商店，可以像装手机 App 一样一键安装 AstrBot。

```bash
curl -fsSL https://get.casaos.io | sudo bash
```

![CasaOS 登录/注册界面，输入用户名和密码创建账户](./images/astrbot-casaos-login.png)

装完会显示访问地址，一般是 `http://你的IP:80`。浏览器打开，注册一个 CasaOS 账号。

### 3.7 一键安装 AstrBot

1. 进入 CasaOS 桌面 → 「App Store」应用商店
2. 右上角搜索 **AstrBot**
3. 点击安装，CasaOS 会自动拉取 Docker 镜像、配置端口映射
4. 等图标从灰色变彩色，就表示装好了

![CasaOS 应用商店中搜索并安装 AstrBot](./images/astrbot-casaos-store.png)

5. 点击 AstrBot 图标进入，或者浏览器直接访问 `http://你的IP:6185`

> 如果应用商店搜不到 AstrBot，或者你想手动控制版本，直接看下面的「方式二：Docker Compose」。

---

## 四、方式二：Docker Compose 部署（通用推荐）

如果你已经有服务器、VPS、或者不想装 CasaOS，用 Docker Compose 是最干净的方式。

### 4.1 安装 Docker

```bash
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

```bash
mkdir astrbot && cd astrbot
wget https://raw.githubusercontent.com/NapNeko/NapCat-Docker/main/compose/astrbot.yml
sudo docker compose -f astrbot.yml up -d
```

> 如果 `wget` 拉不下来，手动创建 `astrbot.yml`：

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

### 4.3 查看状态

```bash
sudo docker logs -f astrbot
sudo docker logs -f napcat
```

---

## 五、方式三：其他部署方式

| 方式 | 命令/说明 | 适合人群 |
|------|----------|---------|
| **uv 手动部署** | `pip install uv` → `uvx astrbot init` → `uvx astrbot run` | 想改源码、二次开发 |
| **Windows 一键安装器** | GitHub Releases 下载 `.exe` 安装器 | 纯小白，只用 Windows |
| **宝塔 / 1Panel** | 应用商店搜索 AstrBot 一键安装 | 已有面板环境 |
| **Arch Linux AUR** | `yay -S astrbot-git` | Arch 用户 |

---

## 六、AstrBot 初始配置

### 6.1 登录 WebUI

浏览器打开：`http://你的服务器IP:6185`

- 默认账号：`astrbot`
- 默认密码：`astrbot`
- **首次登录会强制要求改密码**，改完才能进面板 (ﾉ*･ω･)ﾉ

### 6.2 熟悉面板

登录后左侧菜单：欢迎、机器人、模型提供商、配置文件、插件、知识库、人格设定、更多功能等。

![AstrBot WebUI 仪表盘，左侧菜单栏清晰可见](./images/astrbot-dashboard.png)

---

## 七、接入 AI 大模型（给机器人装大脑）

### 7.1 模型提供商配置

点击左侧「模型提供商」→ 「新增」。AstrBot 支持的提供商非常多：

**对话模型**：OpenAI Compatible、Google Gemini、Anthropic、Kimi、Moonshot、MiniMax、DeepSeek、Zhipu、xAI、NVIDIA、Azure OpenAI、Ollama、SiliconFlow 等。

**其他类型**：
- **Agent 执行器**：Dify、Coze、阿里云百炼等
- **语音转文字（STT）**：OpenAI Whisper、FunASR 等
- **文字转语音（TTS）**：OpenAI TTS、Edge TTS、FishAudio、Azure TTS 等
- **嵌入（Embedding）**：OpenAI Embedding、Ollama Embedding 等，用于知识库
- **重排序（Rerank）**：vLLM Rerank、Jina AI 等

![AstrBot 模型提供商列表，支持对话/Agent/TTS/STT/Embedding/Rerank六大类](./images/astrbot-model-providers.png)

### 7.2 接入示例（以 MiniMax 为例）

1. 选择「OpenAI Compatible」（MiniMax 兼容 OpenAI 格式）
2. 填写：
   - **ID**：`MINIMAX`
   - **API Key**：从 MiniMax 官网获取
   - **API Base URL**：`https://api.minimax.chat/v1`

![MiniMax API 配置界面，填写 ID、API Key 和 Base URL](./images/astrbot-minimax-config.png)

3. 保存 → 点击「获取模型列表」→ 添加模型（如 `MiniMax-M2.7`）→ 启用

> ⚠️ **注意**：Base URL 末尾必须加 `/v1`，不同提供商地址不一样。

### 7.3 配置文件管理

AstrBot 支持为不同机器人分别设置配置文件：

1. 「配置文件」→ 「新建配置文件」（如 `default`、`群聊专用`）
2. 「AI 配置」里选默认对话模型、回退模型、图片转述模型、Agent 执行方式
3. 「平台配置」里选接入的 IM 平台
4. 「插件配置」里选加载哪些插件

---

## 八、接入 QQ

### 8.1 方式 A：QQ 官方开放平台（推荐，视频演示）

适合正式机器人，稳定性高。

1. 访问 [QQ 开放平台](https://q.qq.com) → 创建机器人
2. 获取 **AppID** 和 **Secret**

![QQ 开放平台创建机器人，获取 AppID 和 Secret](./images/astrbot-qq-openplatform.png)

3. AstrBot → 「平台配置」→ 选择「QQ 官方机器人」
4. 填写 AppID、Secret、机器人名称，保存即可上线

> 首次使用需要在 QQ 里搜索你的机器人并添加好友。

### 8.2 方式 B：NapCat（QQ 个人号）

适合用个人 QQ 号当机器人，无需申请，但有小号风控风险。

**NapCat 配置**：

1. 浏览器打开 `http://服务器IP:6099`，输入 Token（看 `docker logs napcat`）
2. 「网络配置」→ 「新建」→ **WebSocket 客户端**
3. 填写：
   - **URL**：`ws://你的服务器IP:6199/ws`（⚠️ 末尾必须有 `/ws`）
   - **消息格式**：`Array`
   - **Token**：设一个强密码
4. 保存

**AstrBot 对接**：

1. 「消息平台」→ 「新增适配器」→ **「接入 QQ 个人号（aiocqhttp）」**
2. 填写：
   - **反向 WebSocket 主机地址**：`0.0.0.0`
   - **端口**：`6199`
   - **Token**：和 NapCat 那边一模一样的密码
3. 保存 → 重启 AstrBot

重启后看到日志输出 **「aiocqhttp(OneBot v11) 适配器已连接」** 就稳了 🤝

### 8.3 管理员权限配置

机器人刚上线时可能回复「没有权限」：

1. 在 QQ 里私聊机器人，发送 `/sid`
2. 机器人返回你的用户 ID
3. AstrBot 面板 → 「平台配置」→ 「管理员 ID」→ 添加你的 ID
4. 保存，现在你有管理员权限了

![QQ 聊天测试，机器人成功回复消息并执行命令](./images/astrbot-qq-chat-test.png)

---

## 九、本地模型部署（Ollama）

不想花钱调 API？用 Ollama 本地跑模型。

### 9.1 安装 Ollama

```yaml
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ./ollama:/root/.ollama
    environment:
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
```

```bash
docker compose up -d
```

### 9.2 下载模型

```bash
docker exec ollama ollama pull llama3.2
docker exec ollama ollama pull mxbai-embed-large
docker exec ollama ollama pull moondream
```

### 9.3 AstrBot 接入 Ollama

1. 「模型提供商」→ 「新增」→ **Ollama**
2. 填写：
   - **ID**：`OLLAMA`
   - **API Key**：随便填，如 `1234`
   - **API Base URL**：`http://你的服务器局域网IP:11434/v1`

   > ⚠️ **重点**：必须填**局域网 IP**，不能填 `localhost` 或 `127.0.0.1`！

3. 保存 → 添加模型 ID（如 `llama3.2`）→ 启用

---

## 十、插件与扩展

### 10.1 插件市场

AstrBot 面板 → 「插件」→ 「插件市场」，挑喜欢的点「安装」：

- **LivingMemory**：长期记忆，记住群友喜好
- **QQ群管插件**：自动禁言、踢人、关键词过滤
- **表情包生成器**：AI 生成沙雕表情包
- **点歌插件**：网易云、QQ音乐、B站
- **万能解析器**：解析抖音、B站、小红书链接

![AstrBot 插件市场，各种插件一键安装](./images/astrbot-plugins-market.png)

装完重启 AstrBot 生效。

### 10.2 LivingMemory 长期记忆

1. 插件市场搜索 **LivingMemory** → 安装
2. 进入插件配置 → 选 Embedding 模型（如 `OLLAMA/mxbai-embed-large`）
3. 选 LLM 模型（用于总结记忆）
4. 保存后，机器人会自动提取聊天关键信息存入记忆

---

## 十一、知识库

### 11.1 创建知识库

1. 「知识库」→ 「创建知识库」
2. 填名称、选图标、选 Embedding 模型
3. 创建

### 11.2 上传文档

1. 进入知识库 → 「上传文档」
2. 支持 PDF、Word、TXT、Markdown
3. 上传后自动分块、向量化
4. 等「分块数」显示数字就表示处理完了

### 11.3 启用知识库

1. 「配置文件」→ 选你的配置 → 「知识库」
2. 「知识库列表」→ 选择知识库
3. 启用「Agentic 知识库检索」→ 保存

### 11.4 网页搜索（免费 Tavily）

1. 注册 [Tavily](https://tavily.com)（有免费额度）
2. 获取 API Key
3. 「配置文件」→ 「网页搜索」→ 启用 → 选 `tavily` → 填 Key
4. 机器人就能实时联网查资料了

---

## 十二、高级功能速览

- **Skills**：上传自定义技能文件，扩展机器人能力
- **SubAgent 编排**：复杂任务拆给多个子代理完成
- **未来任务（Cron Job）**：定时任务，如每天早上发天气预报
- **MCP**：接入 Model Context Protocol 服务器，扩展工具调用
- **平台日志**：出问题看实时日志，DEBUG 级别最详细

---

## 十三、常见问题排查

### Q1：AstrBot 启动失败 / 端口被占用

```bash
sudo lsof -i :6185
sudo lsof -i :6199
```

### Q2：NapCat 连不上 AstrBot

- 检查防火墙/安全组是否放行 6199
- URL 末尾必须有 `/ws`
- 两边 Token 必须完全一致

### Q3：QQ 被封号

- 换老号！新号必死
- 登录后别点「退出登录」，点「隐身」

### Q4：Ollama 连不上

- **必须填局域网 IP**，不能填 `localhost`
- 浏览器访问 `http://IP:11434` 应显示 `Ollama is running`

### Q5：机器人回复「没有权限」

- QQ 里发 `/sid` 获取用户 ID
- 加到 AstrBot「管理员 ID」列表

### Q6：插件安装失败

国内访问 GitHub 慢，插件市场安装时选加速源：
- `https://gh-proxy.com/`
- `https://ghproxy.cn/`

---

## 十四、总结：四步搞定

1. **跑起来**：CasaOS 一键装 / Docker Compose 拉起
2. **接 AI**：填 API Key，选模型
3. **连 QQ**：QQ 开放平台 或 NapCat
4. **加功能**：装插件、建知识库、配长期记忆

完事儿！去群里 @ 你的机器人试试效果吧 ヽ(✿ﾟ▽ﾟ)ノ

---

> **延伸阅读**
> - AstrBot 官方文档：https://docs.astrbot.app
> - AstrBot GitHub：https://github.com/AstrBotDevs/AstrBot
> - NapCat 文档：https://napcat.napneko.icu
> - CasaOS 官网：https://casaos.io
> - LinuxMirrors 换源：https://linuxmirrors.cn
