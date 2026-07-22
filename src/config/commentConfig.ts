import type { CommentConfig } from "../types/commentConfig";

export const commentConfig: CommentConfig = {
	// 评论系统类型："twikoo" | "waline" | "artalk" | "giscus" | "disqus" | "none"
	type: "giscus",

	// ============================================
	// Giscus 配置（基于 GitHub Discussions）
	// ============================================
	giscus: {
		repo: "PAleimiao/Firefly",
		repoId: "R_kgDOTfNppA",
		category: "General",
		categoryId: "DIC_kwDOTfNppM4DBu0p",
		mapping: "pathname",
		reactionsEnabled: true,
		inputPosition: "top",
		theme: "preferred_color_scheme",
		lang: "zh-CN",
		strict: false,
		lazyLoad: true,
	},
};
