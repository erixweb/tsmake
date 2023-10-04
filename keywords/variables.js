export const variables = function (str) {
    const typeIndex = str.indexOf(":")

    if (typeIndex === -1) return str

    return str.substring(typeIndex, -1) + " "
}