// @ts-nocheck

export function exit (runtime: Runtime) {
    if (runtime === "deno" && typeof Deno !== "undefined") {
        Deno.exit()
    } else if (runtime === "node" && typeof process !== "undefined") {
        process.exit()
    }
}