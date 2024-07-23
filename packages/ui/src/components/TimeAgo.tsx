'use client'
import { default as TimeAgoJS } from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en.json'

TimeAgoJS.addDefaultLocale(en)

const TimeAgo = ({ date }: { date: Date }) => {
	const timeAgo = new TimeAgoJS('en-US')
	return <>{timeAgo.format(date)}</>
}
export default TimeAgo
