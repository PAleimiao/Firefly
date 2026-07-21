import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "⚠️ 重要声明",

	// 公告内容
	content: "大家好，这里是 CXL 避难所的站长——啊嘞喵。本站为个人非盈利、非商业性质的学习分享站点，所有内容仅供技术交流与个人记录参考，不构成任何专业建议或商业指导。本站基于 Firefly 主题（MIT 开源协议）构建，与原作者无任何商业关联。引用内容版权归原作者所有，如有侵权请联系删除。",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "查看完整声明",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
