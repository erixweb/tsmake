

export function exit (runtime) {
    if (runtime === "deno" && typeof Deno !== "undefined") {
        Deno.exit()
    } else if (runtime === "node" && typeof process !== "undefined") {
        process.exit()
    }
}