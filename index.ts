import { variables } from "./keywords/variables.ts"
import { isAlpha } from "./utils/alpha.ts"

const contents = Deno.readTextFileSync("repl/index.ts").split("")

const output: string[] = []
const debugMemory = false

if (debugMemory) {
	Deno.writeFileSync("mem.json", new TextEncoder().encode(""))
}

while (contents.length > 0) {
	const memUsage = Deno.memoryUsage()

	if (memUsage.heapUsed > memUsage.heapTotal) {
		console.error(
			"%cMemory used exceeds avalible memory.",
			"color: #fff; background-color: red;"
		)
		Deno.exit()
	} else if (memUsage.heapUsed > (95 / 100) * memUsage.heapTotal) {
		console.warn(
			`%cProgram is using above 95% of the total heap. (${memUsage.heapUsed}/${memUsage.heapTotal})`,
			"color: yellow;"
		)
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

		output.push(`${contents[0]}${string}`)
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
					while (contents[0] !== "\n" && contents[0] !== ",") {
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

							return `"${name}": ${value},\n`
						}
						return `"${element}": ${index},\n`
					})
					.join("")}
			`)
		} else if (keyword === "type" || keyword === "interface") {
			let stop = false
			let currentBracket = 0
			while (!stop) {
				if (contents[0] === "{") {
					currentBracket++
				} else if (contents[0] === "}") {
					currentBracket--
					if (currentBracket === 0) stop = true
				}

				contents.shift()
			}
		} else if (keyword === "import") {
			let path = "", importName = ""
			let semicolons = 0

			while (semicolons < 2) {
				if (contents[0] === "'" || contents[0] === '"') {
					const semicolonType = contents[0]
					contents.shift()

					while (contents[0] !== semicolonType) {
						path += contents.shift()
						
						semicolons++
					}
					importName += semicolonType+path
					importName += contents.shift()
				} else {
					importName += contents.shift()
				}
			}
			if (!path.endsWith(".d.ts")) {
				output.push("import "+importName)
			}

			
		} else {
			output.push(keyword)
		}
	}

	output.push(`${contents.shift()}`)
}
Deno.writeFileSync("compile.js", new TextEncoder().encode(output.join("")))
eval(output.join(""))
