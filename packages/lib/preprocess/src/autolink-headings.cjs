const visit = require('unist-util-visit');

// Like rehype-autolink-headings with behavior: 'wrap', except headings that
// already contain a link: <a> inside <a> is a compile error in Svelte 5.
function containsLink(node) {
	return (node.children ?? []).some(
		(child) => (child.type === 'element' && child.tagName === 'a') || containsLink(child)
	);
}

module.exports = function autolinkHeadings() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (!/^h[1-6]$/.test(node.tagName) || !node.properties?.id) return;
			if (containsLink(node)) return visit.SKIP;
			node.children = [
				{
					type: 'element',
					tagName: 'a',
					properties: { href: `#${node.properties.id}` },
					children: node.children
				}
			];
			return visit.SKIP;
		});
	};
};
