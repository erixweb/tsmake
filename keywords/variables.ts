export const variables = function (str: string) {
    const typeIndex = str.indexOf(":")

    if (typeIndex === -1) return str

    return str.substring(typeIndex, -1) + " "
}