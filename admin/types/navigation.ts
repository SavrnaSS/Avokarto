export type NavigationItem = {
	label: string;
	href: string;
	icon?: string;
	key: string;
	title?: string;
};

export type NavigationGroup = {
	children: NavigationItem[];
	icon: string;
	key: string;
	label: string;
};
