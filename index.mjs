import  { compile } from './compile.mjs'
import  { exit } from './exit.mjs'


let args = []
let fileName
let execute
let joinedArgs
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
execute = joinedArgs?.includes("--exe")

compile(fileName, execute, runtime)
