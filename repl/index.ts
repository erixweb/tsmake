import { Person } from "../types.d.ts"
import { hello } from "./say.ts"

const erik: Person = {
	twitter: {
		name: "Erik",
		created: "2022",
	},
}

console.log(erik.twitter.name)

enum e {
	hello,
	xd,
	lmao = "LMAO",
}

// what is this
console.log(e.hello)

function say(message: any, dos: number) {
	console.log(message)
}

say("Enums enum e { e }")
hello("doso")