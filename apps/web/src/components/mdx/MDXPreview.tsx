import * as mdxComponents from '@repo/ui/mdx'
import { recmaPlugins, rehypePlugins, remarkPlugins } from '@repo/ui/mdx/plugins'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { loadHighlighter } from '@repo/ui/init'

export async function MDXPreview({ contents, withWrapper = true }: { contents: string; withWrapper: boolean }) {
	let allMdxComponents: any = mdxComponents
	if (!withWrapper) {
		const { wrapper, ...restComponents } = mdxComponents
		allMdxComponents = restComponents
	}
	await loadHighlighter()
	return (
		<>
			<MDXRemote
				components={
					{
						...allMdxComponents,
						a: Link,
						Option: () => null,
						Question: () => null,
						Answer: () => null,
					} as any
				}
				options={{
					mdxOptions: {
						rehypePlugins: rehypePlugins.rehypePlugins,
						remarkPlugins: [...remarkPlugins.remarkPlugins],
						recmaPlugins: recmaPlugins.recmaPlugins,
					},
				}}
				source={contents}
			/>
		</>
	)
}
