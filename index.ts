import { variables } from "./keywords/variables.ts"
import { isAlpha } from "./utils/alpha.ts"

const contents = Deno.readTextFileSync("repl/index.ts").split("")
const output: string[] = []
Deno.writeFileSync("mem.json", new TextEncoder().encode(""))

while (contents.length > 0) {
	const memUsage = Deno.memoryUsage()

	if (memUsage.heapUsed > memUsage.heapTotal) {
		console.error(
			"%cMemory used exceeds avalible memory.",
			"color: #fff; background-color: red;"
		)
		Deno.exit()
	} else if (memUsage.heapUsed > (95 / 100) * memUsage.heapTotal) {
		console.warn(`%cProgram is using above 95% of the total heap. (${memUsage.heapUsed}/${memUsage.heapTotal})`, "color: yellow;")
	}
	if (contents[0] === '"' || contents[0] === "'") {
		let string: string
		string = ""
		contents.shift()
		while (contents[0] !== '"' && contents[0] !== "'") {
			if (contents[0] !== undefined) {
				string += contents.shift()
			} else {
				contents.shift()
			}
		}

		output.push(`"${string}`)
	} else if (isAlpha(contents[0])) {
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
		} else if (keyword === "enum") {
			let enums = []

			while (contents[0] !== "}") {
				if (isAlpha(contents[0])) {
					let keyword = ""
					while (contents[0] !== "\n") {
						if (
							contents[0] === "{" ||
							contents[0] === "}" ||
							contents[0] === " " ||
							contents[0] === "\r"
						) {
							contents.shift()
						} else {
							keyword += contents.shift()
						}
					}
					enums.push(keyword)
				} else {
					contents.shift()
				}
			}
			const [enumName, ...enumsRest] = enums

			output.push(`const ${enumName} = {
				${enumsRest
					.map((element, index) => {
						if (element.includes("=")) {
							const name = element.substring(element.indexOf("="), 0)

							const value = element.substring(element.indexOf("=") + 1)

							return `"${name}": ${value}`
						}
						return `"${element}": ${index}`
					})
					.join("")}
			`)
		} else {
			output.push(keyword)
		}
	}

	output.push(`${contents.shift()}`)
}
Deno.writeFileSync("compile.js", new TextEncoder().encode(output.join("")))
eval(output.join(""))
