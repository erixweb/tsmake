import { 
    Person
} 
from
"../types.d.ts"
import { isAlpha } from "../utils/alpha.ts"

const erik: Person = {
	twitter: {
		name: "Erik",
		created: "2022",
	},
}

console.log(erik.twitter.created)

enum e {
	hello,
	xd,
	lmao = "LMAO",
}

// what is this
console.log(e.hello)

function say(message) {
	console.log(message)
}

say("Enums enum e { e }")
