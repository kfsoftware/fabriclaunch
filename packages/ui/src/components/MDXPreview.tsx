'use client'
import { useState, useEffect } from 'react'
import { loadHighlighter } from '../init'
import * as mdxComponents from '../mdx'
import { rehypePlugins } from '../mdx/rehype'
import { remarkPlugins } from '../mdx/remark'
import { MDXProvider } from '@mdx-js/react'
import MDXRuntime from '@mdx-js/runtime'

const DynamicMDX = ({
	contents,
	withWrapper = true,
	extraComponents = {}
}: {
	contents: string
	withWrapper?: boolean
	extraComponents?: {
		[key: string]: any
	}
}) => {
	const [loaded, setLoaded] = useState(false)
	useEffect(() => {
		loadHighlighter().then(() => setLoaded(true))
	}, [])
	if (!loaded) {
		return null
	}
	const { wrapper, ...restMdxComponents } = mdxComponents
	const mdxContent = (
		<MDXProvider>
			<MDXRuntime rehypePlugins={rehypePlugins} remarkPlugins={remarkPlugins} components={{
				...restMdxComponents,
				...extraComponents
			}}>
				{contents}
			</MDXRuntime>
		</MDXProvider>
	)
	if (withWrapper) {
		return wrapper ? wrapper({ children: mdxContent }) : mdxContent
	}
	return mdxContent
}

export default DynamicMDX
