import { CodeGroup, code, pre } from './mdx'
import { rehypePlugins } from './mdx/rehype'
import { remarkPlugins } from './mdx/remark'
import MDXRuntime from '@mdx-js/runtime'
export function P({ children }: { children: React.ReactNode }) {
	return <span>{children}</span>
}
const MDXLabelPreview = ({ contents }: { contents: string }) => (
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

export default MDXLabelPreview
