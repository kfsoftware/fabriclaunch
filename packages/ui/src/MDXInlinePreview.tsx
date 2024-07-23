import { code, pre, CodeGroup } from './mdx'
import { rehypePlugins } from './mdx/rehype'
import { remarkPlugins } from './mdx/remark'
import MDXRuntime from '@mdx-js/runtime'
export function P({ children }: { children: React.ReactNode }) {
	return <p>{children}</p>
}
const MDXInlinePreview = ({ contents }: { contents: string }) => (
	<MDXRuntime
		rehypePlugins={rehypePlugins}
		remarkPlugins={remarkPlugins}
		components={{
			pre,
			CodeGroup,
			code,
			p: P,
		}}
	>
		{contents}
	</MDXRuntime>
)

export default MDXInlinePreview
