import { compile } from "./compile.ts"
import { exit } from "./exit.ts"
import type { Runtime } from "./types.d.ts"
import readDir from "./utils/readDir.ts"

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
runtime = joinedArgs?.includes("--deno") ? "deno" : joinedArgs.includes("--node") ? "node" : runtime

execute = joinedArgs?.includes("--exe")

if (joinedArgs?.includes("--dir")) {
	const fileList = readDir(fileName)
	console.log("%c  TSMake  ", "color: #f0f0f0; background-color: blue;")
	console.log("")
	for (const file of fileList) {
		let initial = performance.now()
		compile(file, false, "node")
		
		console.log(`%c✅ Compiled ${file} in ${performance.now() - initial}ms`, "color: yellow")
	}
} else {
	console.log("%c  TSMake  ", "color: #f0f0f0; background-color: blue;")
	console.log("")
	let initial = performance.now()
	compile(fileName, execute, runtime)
	console.log(`%c✅ Compiled ${fileName} in ${performance.now() - initial}ms`, "color: yellow")

}

