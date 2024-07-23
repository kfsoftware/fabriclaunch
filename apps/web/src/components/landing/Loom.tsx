'use client'
import React, { useState } from 'react'

export function Loom({ src }: { src: string }) {
	return (
		<div style={{ position: 'relative', paddingBottom: '62.5%', height: '0' }} className="my-10 w-full">
			<iframe
				src={src}
				frameBorder={0}
				allowFullScreen
				style={{
					position: 'absolute',
					top: '0',
					left: '0',
					width: '100%',
					height: '100%',
				}}
			/>
		</div>
	)
}

export function LoomById({ id }: { id: string }) {
	const [isLoading, setIsLoading] = useState(true)

	return (
		<div style={{ position: 'relative', paddingBottom: '30.5%', height: '0' }} className="my-10 w-full">
			{isLoading && (
				<a href={`https://www.loom.com/share/${id}`} target="_blank">
					<img
						style={{
							position: 'absolute',
							top: '0',
							left: '0',
							width: '100%',
							height: '100%',
						}}
						src={`https://cdn.loom.com/sessions/thumbnails/${id}-with-play.gif`}
						alt="Loom Thumbnail"
					/>
				</a>
			)}
			<iframe
				src={`https://www.loom.com/embed/${id}?sid=9342277e-b834-46d7-96e5-649377980f34`}
				frameBorder="0"
				allowFullScreen
				onLoad={() => setIsLoading(false)}
				style={{
					display: isLoading ? 'none' : 'block',
					position: 'absolute',
					top: '0',
					left: '0',
					width: '100%',
					height: '100%',
				}}
			/>
		</div>
	)
}
