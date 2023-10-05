
import  { compile } from './compile.mjs'

let args, fileName, execute, joinedArgs

if (typeof Deno !== "undefined") {
	args = Deno.args
} else if (typeof process !== "undefined") {
	console.log(process.argv)
}
joinedArgs = args?.join(" ")
fileName = args[0]
execute = joinedArgs?.includes("--exe")


compile(fileName, execute)
