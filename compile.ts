// @ts-nocheck

import { variables } from "./keywords/variables.ts"
import { isAlpha } from "./utils/alpha.ts"
import { writeFileSync, readFileSync } from "node:fs"
import { exec } from "node:child_process"
import type { Runtime } from "./types.d.ts"
import { chalk } from "./utils/colors.ts"

export async function compile(
	filePath: string,
	run = false,
	runtime: Runtime = "node",
	debug = false
) {
	const output: string[] = []
	const contents = readFileSync(filePath, { encoding: "utf-8" }).split("")
	let mustCompile = true
	if (filePath.endsWith(".js")) mustCompile = false
	while (contents.length > 0 && mustCompile) {
		if (debug) {
			console.log(chalk(`&e------------\n&9Memory&f: ${Deno.memoryUsage().rss / 1024 / 1024}MB\n&9Time&f: ${performance.now()}\n&e------------`))
		}

		// Transpiler
		if (contents[0] === '"' || contents[0] === "'" || contents[0] === "`") {
			let string: string
			string = ""
			let endOfString
			endOfString = contents[0]
			contents.shift()
			while (contents[0] !== endOfString) {
				if (contents[0] !== undefined) {
					let current = contents[0]
					string += contents.shift()
					if (current === "$" && contents[0] === "{") {
						let bracketsCount = 1
						let jsTemplateCode = ""
						string += contents.shift()
						while (bracketsCount > 0) {
							if (contents[0] === "{") {
								bracketsCount++
							} else if (contents[0] === "}") {
								bracketsCount--
							}
							jsTemplateCode += contents.shift()
						}
						string += jsTemplateCode
					}
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
			let shifted = contents.shift()
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
			} else {
				output.push(shifted + contents.shift())
			}
		} else if (isAlpha(contents[0])) {
			let keyword = ""
			while (isAlpha(contents[0])) {
				keyword += contents.shift()
			}
			if (keyword === "let" || keyword === "const") {
				let variable = ""
				while (contents[0] !== "=" && contents[0] !== "\n") {
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
					// worker
					compile(reverseImport + path, false, runtime)

					let jsPath = path.substring(-1, path.length - 2) + "js"

					let item
					if (importName.indexOf('"') > -1 && importName.lastIndexOf('"') > -1) {
						item = importName.substring(importName.indexOf('"'), -1)
					} else if (importName.indexOf("'") > -1 && importName.lastIndexOf("'") > -1) {
						item = importName.substring(importName.indexOf("'"), -1)
					}
					output.push("import " + `${item}'${jsPath}'`)
				} else if (path.endsWith(".d.ts")) {
				} else {
					output.push("import " + importName)
				}
			} else if (keyword === "require") {
				let requires
				let stringtype
				while (contents[0] !== ")") {
					requires += contents.shift()
				}
				if (requires.indexOf('"') !== -1) {
					stringtype = '"'
				} else if (requires.indexOf("'") !== -1) {
					stringtype = "'"
				} else {
					stringtype = "`"
				}
				let path = requires.substring(
					requires.indexOf(stringtype) + 1,
					requires.lastIndexOf(stringtype)
				)

				if (path.endsWith(".ts")) {
					let reverseImport = filePath.replace(".ts", ".js").split("").reverse().join("")
					const fileIndex = reverseImport.indexOf("/")
					reverseImport = reverseImport.substring(fileIndex).split("").reverse().join("")
					compile(reverseImport + path, false, runtime)
					path = path.substring(-1, path.length - 2) + "js"
				}

				output.push(`require("${path}"`)
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
	if (mustCompile) {
		writeFileSync(`debug.txt`, new TextEncoder().encode(output))
		writeFileSync(
			`${filePath.replace(".ts", ".js")}`,
			new TextEncoder().encode(output.join(""))
		)
	}
	if (run) {
		let jsPath = filePath.substring(filePath.lastIndexOf("."), -1) + ".js"
		if (runtime === "deno") {
			let cmd = new Deno.Command("deno", { args: ["run", "--allow-all", jsPath] })
			let { code, stdout, stderr } = await cmd.output()
			console.log(new TextDecoder().decode(stdout))
			if (stderr) {
				console.log(new TextDecoder().decode(stderr))
			}
		} else if (runtime === "node") {
			let cmd = exec(`node ${jsPath}`, (err, stdout) => {
				console.log(stdout)
				if (err) {
					console.log(err)
				}
			})
		}
	}
}
