import { mdxAnnotations } from 'mdx-annotations'
import remarkGfm from 'remark-gfm'
import fauxRemarkEmbedder, { TransformerInfo } from '@remark-embedder/core'
import oembedTransformer from './oembed/index'

const CodeSandboxTransformer = {
	name: 'CodeSandbox',
	shouldTransform(url: string) {
		const { host, pathname } = new URL(url)
		return (
			['codesandbox.io', 'www.codesandbox.io'].includes(host) &&
			pathname.includes('/s/')
		)
	},
	// getHTML can also be async
	getHTML(url: string) {
		const iframeUrl = url.replace('/s/', '/embed/')

		return `<iframe src="${iframeUrl}" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>`
	},
}

const LoomTransformer = {
	name: 'Loom',
	shouldTransform(url: string) {
		const { host } = new URL(url)
		return ['www.loom.com', 'loom.com'].includes(host)
	},
	getHTML(url: string) {
		const iframeUrl = url.replace('www.loom.com/share', 'www.loom.com/embed')
		return `
<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="${iframeUrl}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>
		`
	},
}


const GoogleDriveTransformer = {
	name: 'GoogleDrive',
	shouldTransform(url: string) {
		const { host } = new URL(url)
		return ['drive.google.com'].includes(host)
	},
	getHTML(url: string) {
		const iframeUrl = url.replace('/view', '/preview')
		return `
<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="${iframeUrl}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>
		`
	},
}


function handleHTML(html: string, info: TransformerInfo) {
	const { url, transformer } = info
	if (url.includes('youtube.com')) {
		const transformedHtml = html.replace(`width="200"`, `width="100%"`).replace(`height="113"`, `height="400"`)
		console.log('url', url, transformer.name, info, transformedHtml)
		return `<div class="my-8 embed-youtube aspect-w-16 aspect-h-9">${transformedHtml}</div>`
	} else if (
		transformer.name === '@remark-embedder/transformer-oembed'
	) {
		return `<div class="embed-youtube aspect-w-16 aspect-h-9">${html}</div>`
	}
	return html
}
export const remarkPlugins = [
	mdxAnnotations.remark,
	remarkGfm,
	[
		fauxRemarkEmbedder,
		{
			handleHTML,
			transformers: [CodeSandboxTransformer, LoomTransformer, GoogleDriveTransformer, oembedTransformer]
		}
	],
]
