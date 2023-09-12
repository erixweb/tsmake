import { variables } from "./keywords/variables.ts"
import { isAlpha } from "./utils/alpha.ts"

const contents = Deno.readTextFileSync("repl/index.ts").split("")
const output: string[] = []
while (contents.length > 0) {
	if (isAlpha(contents[0])) {
		let keyword = ""
		while (isAlpha(contents[0])) {
			keyword += contents.shift()
		}

		if (keyword === "let" || keyword === "const") {
			let variable = ""
			while (contents[0] !== "=") {
				variable += contents.shift()
			}

			output.push(variables(`${keyword}${variable}`)!)
		} else {
			output.push(keyword)
		}
	}

	output.push(`${contents.shift()}`)
}
Deno.writeFileSync("compile.js", new TextEncoder().encode(output.join("")))
eval(output.join(""))
