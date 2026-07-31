---
title: "Arch Linux 图形化安装向导：让小白也能一键装 Arch"
published: 2026-08-01
description: "基于 Bash + Dialog 的 Arch Linux 图形化安装向导，支持自动/手动双模式，硬件自动检测，驱动全覆盖，让小白也能轻松安装 Arch。"
tags: [Arch Linux, Linux, 安装教程, 开源项目, Bash]
category: 技术
slug: arch-install-wizard
---

如果你曾经被 Arch Linux 的安装过程劝退过，这篇文章就是为你写的。

Arch Linux 被誉为最纯粹的 Linux 发行版之一，滚动更新、软件最新、高度可定制。但与此同时，它的安装过程也是出了名的"反人类"——没有图形界面，全程命令行，需要手动分区、挂载、配置网络、安装引导……

对于习惯了 Ubuntu 一键安装的小白来说，这简直就是噩梦。网上虽然有很多教程，但大多都是英文的，或者步骤繁琐到让人望而却步。

于是，我做了一个**图形化安装向导**，把 Arch 的安装过程封装成了交互式界面，让小白也能轻松上手。

## 项目介绍

**Arch-Install-Wizard** 是一个基于 Bash + Dialog 的 Arch Linux 图形化安装向导。

**核心特点：**

- **零依赖**：仅需 `dialog`，Arch Live CD 里一行命令就能装
- **纯 Bash**：不需要 Python、不需要 tkinter、不需要图形桌面
- **双模式**：自动安装（一键傻瓜式）和手动安装（逐步自定义）
- **硬件检测**：自动扫描 CPU、显卡、声卡、网卡、蓝牙、触摸板等
- **驱动全覆盖**：NVIDIA / AMD / Intel 显卡、声卡、无线网卡、蓝牙、触摸板、打印机、摄像头、Wine
- **系统优化**：zram 内存压缩、swap、fstab noatime、firewalld 防火墙
- **安全机制**：双系统检测 + 蜂鸣器警报、密码二次确认、格式化二次确认

> [!NOTE]
> 这个项目完全对标 Arch 官方安装流程，官方有的功能我们都有，官方没有的我们也有。

## 为什么做这个？

说实话，我自己装 Arch 的时候也被折腾得够呛。分区搞错、引导装不上、显卡驱动打不上、声卡没声音……每一步都是坑。

后来帮朋友装，朋友看着满屏的英文命令直接懵了。我就想，能不能做个工具，让安装过程像装 Windows 一样简单？

于是就有了这个项目。

## 功能详解

### 1. 硬件自动检测

向导启动后会自动扫描你的硬件：

| 检测项 | 说明 |
|---|---|
| CPU | 型号、核心数、线程数 |
| 显卡 | NVIDIA / AMD / Intel 自动识别 |
| 声卡 | ALSA 设备检测 |
| 有线网卡 | 接口检测 |
| 无线网卡 | Broadcom / Realtek 等识别 |
| 蓝牙 | USB 蓝牙设备检测 |
| 触摸板 | 笔记本触摸板检测 |
| 设备类型 | 自动判断台式机/笔记本 |
| 内存 | 容量检测 |

检测完成后，向导会根据结果**自动推荐驱动方案**，你只需确认即可。

### 2. 双系统检测（安全机制）

这是我觉得最重要的功能。

很多人想装双系统（Windows + Arch），但一不小心就会把 Windows 的引导搞坏。向导会扫描磁盘：

- EFI 分区中的 Windows / Ubuntu / Debian 等引导
- NTFS 分区（Windows）
- 多个 ext 分区（其他 Linux）

**如果检测到双系统：**

1. 蜂鸣器响 3 声（嘟嘟嘟）
2. 显示检测到的系统列表
3. **必须输入 `I KNOW`（全大写）才能继续**
4. 建议手动分区，避免破坏其他系统

> [!WARNING]
> 如果你不确定自己在做什么，强烈建议先备份数据，或者在虚拟机中测试。

### 3. 自动安装模式

适合完全不懂的小白，一键完成：

- **桌面环境**：GNOME Wayland（Ubuntu 风格，新手友好）
- **系统语言**：英文（en_US.UTF-8），可在设置中后续添加中文
- **默认密码**：`arch`（用户名：`user`）
- **分区方案**：自动（EFI 512M + Swap 8G + Root 剩余）
- **镜像源**：中国镜像（清华/中科大/阿里）
- **显卡驱动**：自动检测安装
- **声卡/网卡/蓝牙/触摸板**：自动安装
- **Wine**：自动安装 + 配置
- **常用软件**：Firefox、Edge、QQ、微信、星火商店、LibreOffice、VLC、网易云音乐、VS Code
- **系统优化**：zram + swap + fstab noatime + firewalld
- **装完自动更新并重启**

### 4. 手动安装模式

适合想自定义的老手：

- 磁盘分区（自动 / 手动，支持 `512M`、`8G`、`100G` 格式输入）
- 文件系统（ext4 / btrfs / xfs）
- 用户名/密码/主机名
- 时区/语言（中文/英文/日文/韩文）
- 桌面环境（Hyprland / GNOME / KDE / XFCE）
- 驱动自选（显卡/声卡/无线/蓝牙/触摸板/打印机/摄像头/Wine）
- 额外软件包（浏览器/编辑器/多媒体/办公/游戏）
- 网络管理器/镜像源

### 5. 脚本预览（不直接执行）

向导**不会直接执行危险操作**，而是生成安装脚本，让你先审查：

```bash
# 脚本位置
/tmp/arch-install.sh

# 查看内容
cat /tmp/arch-install.sh

# 确认无误后执行
bash /tmp/arch-install.sh
```

这样你可以看到每一步具体做了什么，心里有底。

## 使用教程

### 准备工作

1. 下载 Arch Linux ISO：https://archlinux.org/download/
2. 制作启动盘（推荐 Ventoy 或 Rufus）
3. 从 U 盘启动，进入 Arch Live CD

### 启动向导

```bash
# 1. 连接网络（有线自动连，无线用 iwctl 或 dhcpcd）
# 2. 安装 dialog（仅需这一步）
pacman -Sy --noconfirm dialog

# 3. 克隆仓库
git clone https://github.com/PAleimiao/Arch-Install-Wizard.git
cd Arch-Install-Wizard

# 4. 运行向导
bash arch-install-wizard.sh
```

### 界面操作

向导使用 Dialog 的 TUI 界面，操作方式：

- **方向键** / **Tab**：移动光标
- **空格**：勾选/取消
- **Enter**：确认
- **Esc** / **Cancel**：返回/取消

### 安装流程

1. **选择模式**：自动安装 / 手动安装
2. **硬件检测**：自动扫描，显示报告
3. **双系统检测**：如有其他系统，会警告并需要确认
4. **选择磁盘**：选择要安装的目标硬盘
5. **配置选项**：根据模式不同，配置分区、用户、桌面等
6. **确认**：显示完整配置摘要，二次确认
7. **生成脚本**：脚本保存到 `/tmp/arch-install.sh`
8. **执行安装**：在终端中运行 `bash /tmp/arch-install.sh`

安装过程大约需要 **10-30 分钟**，取决于网络速度和硬件性能。

## 常见问题

### Q: 安装过程中断怎么办？

A: 脚本使用了 `set -e` 和 `trap`，如果某一步出错会立即中断并显示错误行号。你可以根据提示修复问题后重新运行脚本。

### Q: 双系统引导怎么配置？

A: 向导会自动安装 `os-prober`，GRUB 配置时会扫描其他系统。如果双系统引导有问题，可以手动运行：

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

### Q: 显卡驱动装不上？

A: 向导会自动检测显卡类型并安装对应驱动。如果安装后黑屏，可以在 GRUB 启动项中按 `e` 编辑，在 `linux` 行末尾添加 `nomodeset` 临时禁用显卡驱动，进入系统后手动排查。

### Q: 无线网卡没驱动？

A: 向导会安装常见无线固件（`linux-firmware`、`broadcom-wl-dkms`、`rtl88xxau-aircrack-dkms`）。如果还是不行，建议先插网线上网，进系统后再查具体型号手动安装。

### Q: 为什么默认语言是英文？

A: 自动模式默认英文是为了避免中文字体渲染问题。安装完成后可以在 GNOME 设置中添加中文输入法（Fcitx5 / IBus）。手动模式可以选择中文。

## 项目地址

- **GitHub**: [PAleimiao/Arch-Install-Wizard](https://github.com/PAleimiao/Arch-Install-Wizard)
- **协议**: GPL-3.0

欢迎 Star、Fork、提 Issue！

## 致谢

- [Arch Linux](https://archlinux.org/) - 最好的滚动发行版
- [Arch Wiki](https://wiki.archlinux.org/) - 最全面的 Linux 文档
- [JaKooLit](https://github.com/JaKooLit) - Hyprland 配置灵感来源

---

> 最后说一句：Arch 虽然安装麻烦，但装好之后是真的爽。希望这个向导能让更多人体验到 Arch 的魅力。
>
> 如果你成功安装了，欢迎来评论区报喜。
