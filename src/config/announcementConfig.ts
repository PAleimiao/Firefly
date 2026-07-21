import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "📢 开源声明与免责",

	// 公告内容
	content: "本站基于 Firefly 主题构建，Firefly 基于 MIT 协议开源。本站为个人学习交流用途，所有内容仅代表作者本人观点。",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "查看详情",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
