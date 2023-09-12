export const variables = (str: string) => {
    const typeIndex = str.indexOf(":")
    
    if (typeIndex < 0) return

    return str.substring(typeIndex, -1) + " "
}