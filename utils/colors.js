export function chalk (string) {
    const colors = {
        "&0": "\x1b[30m", 
        "&1": "\x1b[34m", 
        "&2": "\x1b[32m", 
        "&3": "\x1b[36m", 
        "&4": "\x1b[31m", 
        "&5": "\x1b[35m", 
        "&6": "\x1b[33m", 
        "&7": "\x1b[37m", 
        "&8": "\x1b[90m", 
        "&9": "\x1b[94m", 
        "&a": "\x1b[92m", 
        "&b": "\x1b[96m", 
        "&c": "\x1b[91m", 
        "&d": "\x1b[95m", 
        "&e": "\x1b[93m", 
        "&f": "\x1b[97m", 
        "&r": "\x1b[0m", 
    };

    for (const color in colors) {
        string = string.replace(new RegExp(color, "g"), colors[color]);
    }

    return string + "\x1b[0m";
}