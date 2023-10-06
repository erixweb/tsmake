import { Person } from "./types.d.ts"

const hello = require("./say.ts")
const erik = <Person>{
	twitter: {
		name: "Erik",
		created: "'2022'",
	},
}
console.log(erik.twitter.name)

enum e {
	hello,
	xd,
	lmao = "LMAO",
}

// what's this xd' 
// e
console.log(e.hello)

function say(message: any, dos: boolean): void {
	console.log(message, !dos)!
}

say("Enums enum e { e }", false)
hello("doso")

