// components/HumanDate.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { formatRelativeDate } from '@/lib/date'

interface HumanDateProps {
	date: Date | string
	updateInterval?: number
}

export function HumanDate({ date, updateInterval = 60000 }: HumanDateProps) {
	const [formattedDate, setFormattedDate] = useState('')

	useEffect(() => {
		const updateDate = () => {
			const dateObj = typeof date === 'string' ? new Date(date) : date
			setFormattedDate(formatRelativeDate(dateObj))
		}

		updateDate()
		const intervalId = setInterval(updateDate, updateInterval)

		return () => clearInterval(intervalId)
	}, [date, updateInterval])

	return <time dateTime={new Date(date).toISOString()}>{formattedDate}</time>
}
