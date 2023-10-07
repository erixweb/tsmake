import { readdirSync, statSync } from "node:fs"

export default function readDir (dir: string): any {
    const fileList = readdirSync(dir)
    const files = []

    for (const file of fileList) {
        const name = `${dir}/${file}`

        if (statSync(name).isDirectory()) {
            files.push(readDir(name))
        } else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) {
            files.push(name)
        }
    }
	return files.flat()
}