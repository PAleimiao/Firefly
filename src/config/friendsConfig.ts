import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "二次元论坛",
		imgurl:
			"https://pan.ecylt.top/f/qjlh0/www.ecylt.top-icon.jpeg",
		desc: "叮咚！欢迎来到异世界大陆！",
		siteurl: "https://www.ecylt.top/",
		tags: ["world"],
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "WZH Docs",
		imgurl: "https://pan.ecylt.top/f/5vZSN/blog.ecylt.top-icon.ico",
		desc: "WZH团队 - 网络区域避风港 | 技术创新与发展",
		siteurl: "https://blog.ecylt.top/",
		tags: ["blog"],
		weight: 9,
		enabled: true,
	},
	
	{
		title: "云安",
		imgurl: "https://pan.ecylt.top/f/rj2iy/pan.ecylt.top-icon.ico",
		desc: "云安-实惠且安全的云存储服务",
		siteurl: "https://pan.ecylt.top/",
		tags: ["pan"],
		weight: 8,
		enabled: true,
	},

	{
		title: "二次元工具箱",
		imgurl: "https://pan.ecylt.top/f/rj2iy/www.ecylt.top-icon.jpeg",
		desc: "二次元工具箱 - 按下F启动穿越！ - 二次元工具箱",
		siteurl: "https://tools.ecylt.top/",
		tags: ["tools"],
		weight: 7,
		enabled: true,
	},
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
