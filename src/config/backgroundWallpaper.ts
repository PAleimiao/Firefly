import type { BackgroundWallpaperConfig } from "@/types/backgroundWallpaper";

export const backgroundWallpaper: BackgroundWallpaperConfig = {
	// 壁纸模式："banner" 横幅壁纸，"fullscreen" 全屏壁纸，"overlay" 全屏透明，"none" 纯色背景无壁纸
	mode: "banner",

	// 是否启用背景视频播放，配置后将在导航栏显示视频播放按钮
	playerEnable: true,

	src: {
		// 桌面背景图片（支持单张或多张随机）
		// 路径格式：
		// 1. src 目录（不以 "/" 开头，自动优化）："assets/images/DesktopWallpaper/d1.avif"
		// 2. public 目录（以 "/" 开头，不优化）："/assets/images/banner.avif"
		// 3. 远程 URL："https://example.com/banner.jpg"
		desktop: [
			"assets/images/DesktopWallpaper/d1.avif",
			"assets/images/DesktopWallpaper/d2.avif",
			"assets/images/DesktopWallpaper/d3.avif",
			"assets/images/DesktopWallpaper/d4.avif",
			"assets/images/DesktopWallpaper/d5.avif",
			"assets/images/DesktopWallpaper/d6.avif",
		],
		// 移动背景图片（支持单张或多张随机）
		mobile: [
			"assets/images/MobileWallpaper/m1.avif",
			"assets/images/MobileWallpaper/m2.avif",
			"assets/images/MobileWallpaper/m3.avif",
			"assets/images/MobileWallpaper/m4.avif",
			"assets/images/MobileWallpaper/m5.avif",
			"assets/images/MobileWallpaper/m6.avif",
		],
		// 背景视频播放地址
		// 支持远程视频URL，本地视频请放在 public/assets/videos/ 目录下
		playerUrl: "https://pan.ecylt.top/f/QRYF8/video_%E3%80%8A%E5%8F%8D%E4%B9%8C%E6%89%98%E9%82%A6Pt.2%E3%80%8B%E3%80%90%E4%BA%9A%E7%BB%86%E4%BA%9A%E6%97%B7%E4%B8%96..._0.mp4",
	},

	// 横幅壁纸和全屏壁纸共享配置
	common: {
		// 壁纸遮罩暗度，让横幅文字显示更清晰，0-1之间，值越大越暗
		dimOpacity: 0.2,
		// 多视频播放模式："order" 顺序循环，"random" 随机切换
		playerMode: "random",
		// 主页横幅文字
		homeText: {
			// 是否启用主页横幅文字
			enable: true,
			// 主页横幅主标题
			title: "Welcome to CXL",
			// 主页横幅主标题字体大小
			titleSize: "4.5rem",
			// 主页横幅副标题
			subtitle: [
				"A personal shelter for thoughts and creations",
				"Where curiosity finds its refuge",
				"In the glow of fleeting fireflies",
				"Sharing, learning, and growing together",
			],
			// 主页横幅副标题字体大小
			subtitleSize: "1.5rem",
			typewriter: {
				// 是否启用打字机效果
				enable: true,
				// 打字速度（毫秒）
				speed: 100,
				// 删除速度（毫秒）
				deleteSpeed: 50,
				// 完全显示后的暂停时间（毫秒）
				pauseTime: 2000,
			},
		},
		// 文章横幅信息
		postInfo: {
			mode: "description",
		},
		// 导航栏配置
		navbar: {
			// 导航栏透明模式："semi" 半透明，"full" 完全透明，"semifull" 动态透明
			transparentMode: "semi",
			// 毛玻璃模糊度
			blur: 5,
		},
		// 水波纹动画效果配置
		waves: {
			enable: {
				desktop: true,
				mobile: true,
			},
		},
		// 渐变过渡效果配置
		gradient: {
			enable: {
				desktop: true,
				mobile: true,
			},
			height: "10%",
		},
		// 壁纸轮播配置
		carousel: {
			enable: false,
			interval: 5000,
			transitionEffect: "zoom",
		},
	},

	// Banner模式特有配置
	banner: {
		// 图片位置
		position: "0% 20%",
	},

	// 全屏透明覆盖模式特有配置
	overlay: {
		zIndex: -1,
		opacity: 0.8,
		blur: 10,
		cardOpacity: 0.5,
	},

	// 全屏壁纸模式特有配置
	fullscreen: {
		position: "center",
	},
};
