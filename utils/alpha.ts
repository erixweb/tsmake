export const isAlpha = function (a: string) {
	if (typeof a !== "string") return false
	return a.toLowerCase() !== a.toUpperCase()
}
