import { compile } from "./compile.ts"
import { exit } from "./exit.ts"
import type { Runtime } from "./types.d.ts"

let args: any[] = []
let fileName
let execute
let joinedArgs
let runtime: Runtime = "node"

if (typeof Deno !== "undefined") {
	args = Deno.args
	runtime = "deno"
	// @ts-ignore
} else if (typeof process !== "undefined") {
	// @ts-ignore
	args = process.argv.splice(2, process.argv.length)
	runtime = "node"
}

if (args.length < 1) {
	exit(runtime)
}
joinedArgs = args?.join(" ")
fileName = args[0]
execute = joinedArgs?.includes("--exe")

compile(fileName, execute, runtime)
