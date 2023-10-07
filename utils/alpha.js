export const isAlpha = function (a) {
	if (typeof a !== "string") return false
	return a.toLowerCase() !== a.toUpperCase()
}
