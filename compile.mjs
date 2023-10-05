

import  { variables } from './keywords/variables.mjs'
import  { isAlpha } from './utils/alpha.mjs'
import  { writeFileSync, readFileSync } from "node:fs"
import  { exec } from "node:child_process"


export async function compile(filePath, run = false, runtime) {
	const output = []
	const contents = readFileSync(filePath, { encoding: "utf-8" }).split("")
	while (contents.length > 0) {
		
		if (contents[0] === '"' || contents[0] === "'") {
			let string = ""
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
			content = contents.shift()

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
				while (contents[0] !== "=") {
					variable += contents.shift()
				}

				output.push(variables(`${keyword}${variable}`))
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
					compile(reverseImport + path, false, runtime)
					let jsPath = path.substring(-1, path.length - 2) + "mjs"

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
			} else if (keyword === "function") {
				output.push(keyword)
				while (contents[0] !== "{") {
					if (contents[0] === ":") {
						contents.shift()
						while (contents[0] !== ")" && contents[0] !== "," && contents[0] !== "{") {
							contents.shift()
						}
					} else {
						output.push(contents.shift())
					}
				}
			} else {
				output.push(keyword)
			}
		}

		output.push(`${contents.shift()}`)
	}
	writeFileSync(`${filePath.replace(".ts", ".mjs")}`, new TextEncoder().encode(output.join("")))
	if (run) {
		let jsPath = filePath.substring(filePath.lastIndexOf("."), -1) + ".mjs"
		console.log(jsPath)
		if (runtime === "deno") {
			let cmd = new Deno.Command("deno", { args: ["run", jsPath] })
			let { code, stdout, stderr } = await cmd.output()
			console.log(new TextDecoder().decode(stdout))
		} else if (runtime === "node") {
			let cmd = exec(`node ${jsPath}`, (err, stdout) => {
				console.log(stdout)
			})
		}
	}
}
