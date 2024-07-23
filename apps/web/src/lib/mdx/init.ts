import { SHIKI_LANGUAGES_TO_LOAD } from "@/constants"
import { getHighlighter } from "shiki"

export let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null

export async function loadHighlighter() {
	highlighter = highlighter ?? await getHighlighter({
		themes: ['dracula', 'vitesse-dark', 'vitesse-light'],
		langs: SHIKI_LANGUAGES_TO_LOAD
	})
}
