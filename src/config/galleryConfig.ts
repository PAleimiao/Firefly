import type { GalleryConfig } from "@/types/galleryConfig";

// 相册配置
export const galleryConfig: GalleryConfig = {
	// 相册列表
	albums: [
		// 支持jpg/png/webp/avif/gif格式
		// id: 相册唯一标识符（用于目录命名和URL路径）
		// cover: 手动指定封面图（可选，支持本地路径或外链）
		// coverVideo: 封面视频（可选，支持云安等外链视频）
		// name: 相册名称
		// description: 相册描述
		// location: 相册拍摄地点
		// date: 相册日期，格式为 YYYY-MM-DD，用于排序和显示
		// tags: 相册标签
		// password: 访问密码（可选）
		// passwordHint: 密码提示（可选）
		// externalImages: 外链图片列表（可选，如果填写则优先使用外链而非本地图片）
		// externalSource: 外链来源标识（如 "yunpan"）
		{
			id: "2233",
			name: "2233",
			description: "哔哩哔哩 22娘 & 33娘 图集",
			location: "哔哩哔哩",
			date: "2026-08-02",
			tags: ["2233", "哔哩哔哩", "B站"],
		},
		{
			id: "encrypted-album",
			name: "图集",
			description: "精选图集",
			location: "网络",
			date: "2026-08-02",
			tags: ["图集", "精选"],
		},
	],

	// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
	columnWidth: 240,
};
