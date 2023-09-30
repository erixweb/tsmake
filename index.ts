// @ts-nocheck	
import { variables } from "./keywords/variables.ts"
import { isAlpha } from "./utils/alpha.ts"

const debugMemory = false

if (debugMemory) {
	Deno.writeFileSync("mem.json", new TextEncoder().encode(""))
}
if (Deno.args.length < 1) {
	console.error("%c❌ Si us plau has de posar el nom d'un arxiu com a argument", "color: red")
	Deno.exit()
}

async function compile(filePath: string, run = false, origin = "") {
	const output: string[] = []
	const contents = Deno.readTextFileSync(filePath).split("")
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

		// Transpiler
		if (contents[0] === '"' || contents[0] === "'") {
			let string: string
			string = ""
			let endOfString
			if (contents[0] === '"') endOfString = '"'
			if (contents[0] === "'") endOfString = "'"
			contents.shift()
			while (contents[0] !== endOfString) {
				if (contents[0] !== undefined) {
					string += contents.shift()
				} else {
					contents.shift()
				}
			}

			output.push(`${contents[0]}${string}`)
		} else if (contents[0] === "!") {
			contents.shift()
			if (isAlpha(contents[0]) || contents[0] === "=") {
				output.push("!")
			}
		} else if (contents[0] === "<") {
			let stop = false

			let content = ""
			contents[0] = "<"
			content = contents.shift()!

			while (!stop) {
				if (
					contents[0] === ")" ||
					contents[0] === ";" ||
					contents[0] === "|" ||
					contents[0] === "&"
				) {
					stop = true
					output.push(content)
				} else if (contents[0] === ">") {
					contents.shift()
					stop = true
				} else {
					content += contents.shift()
				}
			}
		} else if (contents[0] === "/") {
			contents.shift()
			if (contents[0] === "/") {
				contents[0] = "/"
				while (contents[0] !== "\n") {
					contents.shift()
				}
			} else if (contents[0] === "*") {
				contents[0] = "*"
				let stop = false

				while (!stop) {
					if (contents[0] !== "*") {
						contents.shift()
					} else if (contents[0] === "*") {
						contents.shift()
						contents[0] = contents[0]

						if (contents[0] === "/") {
							contents.shift()
							stop = true
						}
					}
				}
			}
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
				let path = "",
					importName = ""
				let semicolons = 0

				while (semicolons < 2) {
					if (contents[0] === "'" || contents[0] === '"') {
						const semicolonType = contents[0]
						contents.shift()

						while (contents[0] !== semicolonType) {
							path += contents.shift()

							semicolons++
						}
						importName += semicolonType + path
						importName += contents.shift()
					} else {
						importName += contents.shift()
					}
				}
				if (path.endsWith(".js")) {
					output.push("import " + importName)
				} else if (path.endsWith(".ts") && !path.endsWith(".d.ts")) {
					let reverseImport = filePath.replace(".ts", ".js").split("").reverse().join("")
					const fileIndex = reverseImport.indexOf("/")
					reverseImport = reverseImport.substring(fileIndex).split("").reverse().join("")
					compile(reverseImport + path, false)

					output.push("import " + `${importName}`)
				}
			} else if (keyword === "function") {
				output.push(keyword)
				while (contents[0] !== "{") {
					if (contents[0] === ":") {
						contents.shift()
						while (contents[0] !== ")" && contents[0] !== "," && contents[0] !== "{") {
							contents.shift()
						}
					} else {
						output.push(contents.shift()!)
					}
				}
			} else {
				output.push(keyword)
			}
		}

		output.push(`${contents.shift()}`)
	}
	Deno.writeFileSync(
		`${filePath.replace(".ts", ".js")}`,
		new TextEncoder().encode(output.join(""))
	)
	if (run) {
		let cmd = new Deno.Command("deno", { args: ["run", "repl/index.js"] })
		let { code, stdout, stderr } = await cmd.output()
		console.log(new TextDecoder().decode(stdout))
	}
}
compile(Deno.args[0], true)
