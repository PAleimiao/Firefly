---
title: "Linux 桌面美化全指南：从 Hyprland 到 GNOME/KDE，手把手教你 Ricing"
published: 2026-08-02
description: "Linux 桌面美化（Ricing）完整攻略，覆盖 Hyprland/Wayland、GNOME、KDE Plasma、XFCE 等主流桌面环境，壁纸、主题、图标、终端、锁屏一条龙，看完你的桌面比 macOS 还好看。"
tags: [Linux, 美化, Hyprland, Wayland, GNOME, KDE, 桌面环境, Ricing, 教程]
category: 教程
slug: linux-desktop-ricing-guide
image: ./images/linux-rice-awesome.png
---

> 本文最后更新于 2026-08-02，基于 Hyprland 0.48、GNOME 48、KDE Plasma 6.7 整理。  
> 美化有风险，折腾需谨慎，备份 dotfiles 再动手 ( •̀ ω •́ )✧

<!-- more -->

## 零、啥是 Ricing？

**Ricing** 是 Linux 圈的黑话，意思就是把你的桌面环境「装修」得漂漂亮亮。这个词来源于汽车改装（Rice Rocket），传到 Linux 圈就变成了「把默认丑爆的桌面改成你独一无二的样子」。

别人的桌面：

![Linux Ricing 示例 — Awesome WM 风格桌面，包含终端、音乐播放器、系统监控](https://kimi-web-img.moonshot.cn/img/venam.net/9d552bac03f7a218f67484e445f0d3ed4ba511f4.png)

你的桌面：

……算了，默认桌面啥样你心里清楚。

本文按桌面环境分类，**对号入座，别瞎套**。Hyprland 用户看第二章，GNOME 用户看第四章，KDE 用户看第五章，别拿 Hyprland 的配置往 GNOME 上硬套，那跟把自行车胎装汽车上没区别。

---

## 一、通用准备工作

不管啥桌面环境，美化前先把这几样装好：

```bash
# 字体（中文字体必装，不然美化完全是方块）
sudo pacman -S noto-fonts noto-fonts-cjk noto-fonts-emoji ttf-dejavu
# Ubuntu/Debian
sudo apt install fonts-noto fonts-noto-cjk fonts-noto-color-emoji

# 图标主题工具
sudo pacman -S papirus-icon-theme
# 或者去 pling.com 下载更多图标包

# 壁纸工具
sudo pacman -S swaybg feh nitrogen
```

> ⚠️ **带脑子提醒**：以下所有配置都是示例，你的显示器分辨率、显卡驱动、发行版版本可能跟我不一样。**改配置前先备份原文件**，出事了别找我。

---

## 二、Hyprland 美化（重点章节）

Hyprland 是 Wayland 下的平铺式窗口管理器，**自由度极高，也极易翻车**。但配好了是真的帅，帅到隔壁用 macOS 的都来问你这是啥系统。

### 2.1 配置文件位置

Hyprland 所有配置都在 `~/.config/hypr/` 下：

```
~/.config/hypr/
├── hyprland.conf      # 主配置
├── monitors.conf      # 显示器配置
├── windowrules.conf   # 窗口规则
├── themes/
│   └── Catppuccin-Mocha/   # 主题文件夹
│       ├── hypr.theme
│       └── wallpapers/
├── waybar/            # 状态栏配置
├── rofi/              # 启动器配置
└── kitty/             # 终端配置
```

### 2.2 壁纸设置

Hyprland 本身不带壁纸工具，需要 `swaybg` 或 `mpvpaper`（动态壁纸）：

```bash
# 静态壁纸
sudo pacman -S swaybg

# 在 hyprland.conf 里加一行
exec-once = swaybg -i ~/.config/hypr/themes/Catppuccin-Mocha/wallpapers/your-wallpaper.jpg -m fill

# 动态壁纸（视频壁纸）
yay -S mpvpaper
exec-once = mpvpaper -o "no-audio loop" HDMI-A-1 ~/Videos/wallpaper.mp4
```

> 💡 按 `Super + Shift + W`（如果你配了快捷键）可以切换壁纸。壁纸放主题目录下，不然重启会被覆盖。

### 2.3 Waybar 状态栏美化

Waybar 是 Hyprland 最常用的状态栏，高度可定制：

```bash
sudo pacman -S waybar
```

配置文件在 `~/.config/waybar/`：

```css
/* ~/.config/waybar/theme.css */
@define-color bar-bg rgba(31, 35, 40, 0.85);
@define-color main-bg #1e1e2e;
@define-color main-fg #cdd6f4;
@define-color wb-act-bg #89b4fa;
@define-color wb-act-fg #1e1e2e;
@define-color wb-hvr-bg #b4befe;
@define-color wb-hvr-fg #1e1e2e;
```

常用模块：工作区、窗口标题、CPU、内存、网络、音量、电池、时间、托盘图标。改 `config.json` 就能增删模块。

### 2.4 Rofi 启动器美化

Rofi 是应用启动器 + 窗口切换器，按 `Super + A` 呼出：

```bash
sudo pacman -S rofi-wayland
```

主题文件 `~/.config/rofi/theme.rasi`：

```css
* {
    main-bg: #1e1e2e;
    main-fg: #cdd6f4;
    main-br: #89b4fa;
    select-bg: #89b4fa;
    select-fg: #1e1e2e;
    separatorcolor: transparent;
    border-color: transparent;
}
```

### 2.5 Swaylock 锁屏美化

锁屏也能美！`swaylock-effects` 支持模糊、暗角、时钟：

```bash
yay -S swaylock-effects
```

配置 `~/.config/swaylock/config`：

```
daemonize
show-failed-attempts
clock
screenshot
effect-blur=15x15
effect-vignette=1:1
color=1f1d2e80
font="Inter"
indicator
indicator-radius=200
indicator-thickness=20
ring-color=89b4fa
inside-color=1e1e2e
text-color=cdd6f4
```

### 2.6 窗口边框与圆角

在 `hyprland.conf` 的 `general` 和 `decoration` 段里调：

```ini
general {
    gaps_in = 3
    gaps_out = 8
    border_size = 2
    col.active_border = rgba(89b4faff) rgba(b4befeff) 45deg
    col.inactive_border = rgba(595959aa)
    layout = dwindle
}

decoration {
    rounding = 10
    drop_shadow = false
    blur {
        enabled = yes
        size = 5
        passes = 4
        new_optimizations = on
        ignore_opacity = on
    }
}
```

### 2.7 鼠标指针与图标主题

```bash
# 鼠标指针
paru -S bibata-cursor-theme

# 图标主题
paru -S sweet-folders-icons-git

# 在 hyprland.conf 里应用
exec = hyprctl setcursor Bibata-Modern-Classic 20
exec = gsettings set org.gnome.desktop.interface cursor-theme 'Bibata-Modern-Classic'
exec = gsettings set org.gnome.desktop.interface icon-theme 'Sweet-Teal-Filled'
exec = gsettings set org.gnome.desktop.interface gtk-theme 'Graphite-Mono'
exec = gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
```

### 2.8 终端美化（Kitty）

```bash
sudo pacman -S kitty
```

`~/.config/kitty/kitty.conf`：

```
font_family      JetBrainsMono Nerd Font
font_size        12
background       #1e1e2e
foreground       #cdd6f4
cursor           #f5e0dc
cursor_text_color #1e1e2e
selection_background #353749
selection_foreground #cdd6f4
color0  #45475a
color8  #585b70
color1  #f38ba8
color9  #f38ba8
color2  #a6e3a1
color10 #a6e3a1
# ... 更多配色自行扩展
```

> 🔥 **推荐**：装个 `pokemon-colorscripts`，每次开终端随机显示宝可梦 ASCII  art，贼有意思。

### 2.9 SDDM 登录界面美化

开机第一眼也要帅：

```bash
# 下载主题
git clone https://github.com/minMelody/sddm-sequoia.git
sudo mv sddm-sequoia /usr/share/sddm/themes/sequoia

# 修改背景图
sudo cp ~/Pictures/your-wallpaper.jpg /usr/share/sddm/themes/sequoia/backgrounds/forest.jpg

# 启用主题
sudo vim /etc/sddm.conf
# [Theme]
# Current=sequoia
```

### 2.10 Grub 引导菜单美化

连开机引导都能美：

```bash
git clone https://github.com/vinceliuice/grub2-themes.git
cd grub2-themes
sudo ./install.sh -t vimix -c 2560x1600 -i white

# 替换背景
sudo cp ~/Pictures/your-wallpaper.jpg /usr/share/grub/themes/vimix/background.jpg
```

---

## 三、Wayland 通用美化工具

不管你用 Hyprland、Sway 还是其他 Wayland 合成器，这些工具都通用：

| 工具 | 作用 | 安装 |
|------|------|------|
| **swaybg** | 静态壁纸 | `sudo pacman -S swaybg` |
| **mpvpaper** | 动态视频壁纸 | `yay -S mpvpaper` |
| **Waybar** | 状态栏 | `sudo pacman -S waybar` |
| **Rofi** | 应用启动器 | `sudo pacman -S rofi-wayland` |
| **Swaylock** | 锁屏 | `yay -S swaylock-effects` |
| **Dunst** | 通知守护进程 | `sudo pacman -S dunst` |
| **Foot** | Wayland 原生终端 | `sudo pacman -S foot` |
| **Mako** | 通知（Sway 用） | `sudo pacman -S mako` |
| **Wofi** | Rofi 替代品 | `sudo pacman -S wofi` |

> ⚠️ **Wayland 注意**：X11 时代的工具（如 `feh`、`polybar`、`i3lock`）在 Wayland 下要么不能用，要么要跑在 Xwayland 里，性能差一截。**尽量找原生 Wayland 替代品**。

---

## 四、GNOME 美化（Ubuntu / Debian / Deepin / Fedora 默认）

GNOME 是大多数发行版的默认桌面，**开箱即丑，但潜力无限**。

![GNOME 美化示例 — 深色主题、自定义图标、Dock 栏](https://kimi-web-img.moonshot.cn/img/www.debugpoint.com/cdc15c092b68c3057f77de10b358390230a8ed76.jpg)

### 4.1 必备工具

```bash
# GNOME Tweaks（调主题、字体、扩展）
sudo apt install gnome-tweaks

# GNOME Extensions（浏览器插件 + 本地工具）
sudo apt install chrome-gnome-shell
# 然后去浏览器装 GNOME Shell integration 插件
```

### 4.2 推荐扩展

去 [extensions.gnome.org](https://extensions.gnome.org) 装这些：

| 扩展名 | 作用 |
|--------|------|
| **User Themes** | 加载第三方 Shell 主题 |
| **Blur My Shell** | 给面板、Dock、锁屏加毛玻璃 |
| **Just Perfection** | 微调 GNOME 各种细节 |
| **Dash to Dock** | 把 Dash 变成 Dock 栏 |
| **Clipboard Indicator** | 剪贴板历史 |
| **Caffeine** | 一键禁止息屏 |
| **GSConnect** | 手机互联（KDE Connect 的 GNOME 版） |

### 4.3 主题安装

```bash
# 推荐主题：Orchis、WhiteSur、Graphite
# 去 pling.com 或 GitHub 下载，解压到 ~/.themes/

# 图标主题：Papirus、Tela、Sweet
# 解压到 ~/.icons/ 或 /usr/share/icons/

# 应用主题
gnome-tweaks → 外观 → 选择主题
```

![GNOME 外观设置面板](https://kimi-web-img.moonshot.cn/img/linuxdynamics.com/df931dc9f4dcea095d8c9b64a210adde518fa547.webp)

### 4.4 字体优化

```bash
# 安装字体
sudo apt install fonts-inter fonts-jetbrains-mono

# 在 gnome-tweaks 里设置：
# 界面字体：Inter 11
# 等宽字体：JetBrains Mono 11
# 文档字体：Noto Sans CJK SC 11
```

### 4.5 锁屏与登录界面

GNOME 锁屏主题跟随 Shell 主题，登录界面（GDM）需要额外配置：

```bash
# 设置 GDM 背景（需 root）
sudo cp /usr/share/themes/Orchis/gnome-shell/gnome-shell.css /usr/share/gnome-shell/theme/
# 或者直接用 gdm-settings 工具
sudo apt install gdm-settings
```

---

## 五、KDE Plasma 美化（Kubuntu / Arch 可选）

KDE Plasma 是**自定义程度最高的桌面环境**，没有之一。你想改啥都能改，甚至能改成 macOS、Windows、或者你从来没见过的样子。

![KDE Plasma 6.7 主题展示](https://kimi-web-img.moonshot.cn/img/itsfoss.com/b899c328d488c2d30b270b2c06a38241ebefd70c.png)

### 5.1 系统设置里直接改

KDE 大部分美化都在**系统设置 → 外观**里，不用敲命令：

- **全局主题**：一键切换整套风格
- **Plasma 样式**：面板、按钮、滑块样式
- **应用程序风格**：GTK 应用的外观
- **图标**：图标主题
- **光标**：鼠标指针
- **欢迎屏幕**：登录界面
- **锁屏**：锁屏界面

![KDE Plasma 6.6 桌面与系统信息面板](https://kimi-web-img.moonshot.cn/img/i0.wp.com/670239f428aa0fd45a3e9266451575f661d4968c.webp)

### 5.2 推荐主题

去 **系统设置 → 外观 → 获取新的主题** 直接在线下载：

| 主题名 | 风格 |
|--------|------|
| **Sweet** | 紫色渐变，赛博朋克感 |
| **Materia** | 扁平 Material 风 |
| **WhiteSur** | 仿 macOS |
| **Orchis** | 现代圆角深色 |
| **Layan** | 半透明毛玻璃 |

![KDE Plasma 精美主题展示](https://kimi-web-img.moonshot.cn/img/itsfoss.com/71479d4b0af2277f781b8e125418c25d9c4b8e18.webp)

### 5.3 Kvantum 引擎

KDE 默认的 Breeze 引擎不够骚？换 Kvantum：

```bash
# Arch
sudo pacman -S kvantum

# 在系统设置 → 应用程序风格 → Kvantum 里选择主题
```

Kvantum 主题支持半透明、模糊、圆角，效果比 Breeze 好太多。

### 5.4 Latte Dock（Plasma 6 已内置）

Plasma 6 把 Latte Dock 的功能内置了，**面板可以直接拖成 Dock**：

1. 右键面板 → 进入编辑模式
2. 把面板拖到屏幕底部
3. 调整图标大小、间距、透明度
4. 开启「浮动」效果，就是 macOS 那种 Dock

### 5.5 窗口特效

**系统设置 → 窗口管理 → 桌面特效**：

- **模糊**：给面板和终端加毛玻璃
- **魔灯**：最小化/最大化动画
- **立方体桌面**：Alt+Tab 3D 切换
- **火焰鼠标**：鼠标拖尾（花里胡哨但好玩）

---

## 六、XFCE / 轻量级桌面美化

如果你的电脑配置低，或者你就是喜欢轻量简洁，XFCE 也能美：

```bash
# XFCE 主题
sudo pacman -S xfce4-whiskermenu-plugin xfce4-docklike-plugin

# 推荐主题：Arc、Adapta、Mojave
# 图标：Papirus、Elementary
```

XFCE 美化要点：
1. **Whisker Menu** 替换默认菜单，更好看
2. **Docklike** 插件把任务栏变成 Dock
3. **xfce4-panel** 调透明度和背景色
4. **Compton/Picom** 加阴影和透明（X11 下）

> XFCE 在 Wayland 下支持还不完善，建议 X11 + Picom。

---

## 七、通用美化资源站

| 网站 | 内容 |
|------|------|
| [pling.com](https://pling.com) | 主题、图标、光标、壁纸最全 |
| [reddit.com/r/unixporn](https://reddit.com/r/unixporn) | 桌面美化灵感（R18 注意，不是那个意思，是太好看你会沉迷） |
| [github.com/unixporn](https://github.com/unixporn) | dotfiles 仓库 |
| [gnome-look.org](https://gnome-look.org) | GNOME 专属主题 |
| [store.kde.org](https://store.kde.org) | KDE 专属主题 |

---

## 八、备份你的 dotfiles

折腾半天配好的环境，重装系统全没了？用 Git 备份：

```bash
# 创建 dotfiles 仓库
mkdir ~/dotfiles
cd ~/dotfiles
git init

# 把配置文件软链接过来
ln -s ~/.config/hypr ~/dotfiles/hypr
ln -s ~/.config/waybar ~/dotfiles/waybar
ln -s ~/.config/kitty ~/dotfiles/kitty
ln -s ~/.config/rofi ~/dotfiles/rofi
ln -s ~/.bashrc ~/dotfiles/bashrc

# 提交
git add .
git commit -m "Backup dotfiles"

# 推送到 GitHub
git remote add origin https://github.com/你的用户名/dotfiles.git
git push -u origin master
```

或者直接用 **GNU Stow** 管理：

```bash
sudo pacman -S stow
cd ~/dotfiles
stow hypr waybar kitty rofi  # 自动创建软链接
```

---

## 九、总结

| 桌面环境 | 美化难度 | 自由度 | 推荐人群 |
|----------|---------|--------|----------|
| **Hyprland** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 极客、键盘党、爱折腾 |
| **GNOME** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 普通用户、Ubuntu 党 |
| **KDE Plasma** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 喜欢自定义一切的人 |
| **XFCE** | ⭐⭐⭐ | ⭐⭐⭐ | 低配机、极简主义者 |

**一句话总结**：
- 想帅到没朋友 → Hyprland + Waybar + Rofi + Swaylock
- 想稳定好看 → GNOME + Blur My Shell + Dash to Dock
- 想改啥都行 → KDE Plasma + Kvantum + Latte Dock
- 想省电流畅 → XFCE + Arc 主题 + Papirus 图标

---

> **免责声明**：美化过程中可能导致系统不稳定、主题冲突、窗口管理器崩溃。**操作前备份 dotfiles**，出了问题别找我赔 (￣▽￣)"  
> 如果文章帮到你，欢迎去我博客点个 star ⭐
