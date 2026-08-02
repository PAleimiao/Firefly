import type { BackgroundWallpaper } from "@/types/backgroundWallpaper";

// 首页背景壁纸配置
export const backgroundWallpaper: BackgroundWallpaper = {
	// 是否开启背景壁纸
	enabled: true,

	// 移动端背景壁纸
	mobileImages: [
		"https://pan.ecylt.top/f/RRgfM/1.png",
		"https://pan.ecylt.top/f/eWzFx/2.png",
		"https://pan.ecylt.top/f/lv0S6/3.png",
	],

	// 桌面端背景壁纸
	images: [
		"https://pan.ecylt.top/f/E2ZF9/4.png",
		"https://pan.ecylt.top/f/DbOsD/5.png",
		"https://pan.ecylt.top/f/9ypTK/6.png",
		"https://pan.ecylt.top/f/JMJuJ/7.png",
		"https://pan.ecylt.top/f/ZoDSV/8.png",
	],

	// 视频背景（可选，与图片背景二选一，视频优先级更高）
	// 暂时禁用视频，使用图片轮播
	// video: "https://pan.ecylt.top/f/QRYF8/1774274407628394.mp4",

	// 首页主标题
	mainTitle: "Welcome to CXL",

	// 首页副标题（支持多行，会循环打字机效果显示）
	subTitle: [
		"A personal shelter for thoughts and creations",
		"Where curiosity finds its refuge",
		"In the glow of fleeting fireflies",
		"Sharing, learning, and growing together",
	],

	// 主标题打字机效果配置
	mainTitleTypewriter: {
		// 打字机效果速度（毫秒）
		speed: 150,
		// 打字机效果延迟（毫秒）
		delay: 150,
		// 打字机效果循环
		loop: true,
		// 打字机效果循环延迟（毫秒）
		loopDelay: 3000,
		// 打字机效果光标
		cursor: "|",
		// 打字机效果光标闪烁
		cursorBlink: true,
		// 打字机效果光标闪烁速度（毫秒）
		cursorBlinkSpeed: 500,
	},

	// 副标题打字机效果配置
	subTitleTypewriter: {
		// 打字机效果速度（毫秒）
		speed: 80,
		// 打字机效果延迟（毫秒）
		delay: 1000,
		// 打字机效果循环
		loop: true,
		// 打字机效果循环延迟（毫秒）
		loopDelay: 5000,
		// 打字机效果光标
		cursor: "|",
		// 打字机效果光标闪烁
		cursorBlink: true,
		// 打字机效果光标闪烁速度（毫秒）
		cursorBlinkSpeed: 500,
	},
};
