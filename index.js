import  { compile } from './compile.js'
import  { exit } from './exit.js'

import  readDir from './utils/readDir.js'

let args = []
let fileName
let execute
let joinedArgs
let debug 
let runtime = "node"
if (typeof Deno !== "undefined") {
	args = Deno.args
	runtime = "deno"
	
} else if (typeof process !== "undefined") {
	
	args = process.argv.splice(2, process.argv.length)
	runtime = "node"
}

if (args.length < 1) {
	exit(runtime)
}
joinedArgs = args?.join(" ")
fileName = args[0]
runtime = joinedArgs?.includes("--deno") ? "deno" : joinedArgs.includes("--node") ? "node" : runtime
debug = joinedArgs?.includes("--debug") ? true : false

execute = joinedArgs?.includes("--exe")

if (joinedArgs?.includes("--dir")) {
	const fileList = readDir(fileName)
	console.log("%c  TSMake  ", "color: #f0f0f0; background-color: blue;")
	console.log("")
	for (const file of fileList) {
		let initial = performance.now()
		compile(file, false, "node", debug)
		
		console.log(`%c✅ Compiled ${file} in ${performance.now() - initial}ms`, "color: yellow")
	}
} else {
	console.log("%c  TSMake  ", "color: #f0f0f0; background-color: blue;")
	console.log("")
	let initial = performance.now()
	compile(fileName, execute, runtime, debug)
	console.log(`%c✅ Compiled ${fileName} in ${performance.now() - initial}ms`, "color: yellow")

}

