/**
 * A store's "Additional CSS". Sellers style their own storefront, but CSS
 * must never load anything (url(), @import, image-set(), @font-face) - that
 * could leak what shoppers type into external requests - and must stay a
 * plain stylesheet (no "<" to break out of the <style> tag, no backslash
 * escapes that could disguise any of the above). Checked when saving, and
 * again before rendering. Never applied on checkout pages.
 */
export const CUSTOM_CSS_MAX = 10_000;

const FORBIDDEN: [RegExp, string][] = [
	[/</, "“<” isn't allowed in CSS here."],
	[/\\/, "Backslash escapes aren't allowed."],
	[/url\s*\(/i, "url() isn't allowed - custom CSS can't load images or files."],
	[/@import/i, "@import isn't allowed - custom CSS can't load other stylesheets."],
	[/@font-face/i, "@font-face isn't allowed - pick a font pairing in Typography instead."],
	[/@namespace|@charset/i, "@namespace and @charset aren't allowed."],
	[/image-set\s*\(|image\s*\(|cross-fade\s*\(|element\s*\(|src\s*\(/i, "Image functions aren't allowed - custom CSS can't load images."],
	[/expression\s*\(|javascript:|behavior\s*:|-moz-binding/i, "That isn't allowed in CSS."],
];

/** Why this CSS can't be used, or null if it's fine. */
export function customCssProblem(css: string): string | null {
	if (css.length > CUSTOM_CSS_MAX) return `Keep custom CSS under ${CUSTOM_CSS_MAX.toLocaleString("en-US")} characters.`;
	for (const [pattern, message] of FORBIDDEN) if (pattern.test(css)) return message;
	// Strings and comments can hold braces; count the rest.
	const bare = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"]*"|'[^']*'/g, "");
	let depth = 0;
	for (const char of bare) {
		if (char === "{") depth += 1;
		else if (char === "}") depth -= 1;
		if (depth < 0) return "There's a “}” without a matching “{”.";
	}
	if (depth !== 0) return "A “{” is never closed with “}”.";
	if (/\/\*(?![\s\S]*\*\/)/.test(css)) return "A /* comment is never closed with */.";
	return null;
}
