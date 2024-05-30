import { mermaidToObject } from "../src/origins/mermaid.js"
import { xstateObjToxstateJS } from "../src/targets/xstate.js"

export async function mmdToObjectFSM(fullFilePath){
	const file = Bun.file(fullFilePath)
	const mermaidText = await file.text()
	const obj = await mermaidToObject(mermaidText)
	return obj
}

export async function mmdToXstate(fullFilePath){
	const file = Bun.file(fullFilePath)
	const mermaidText = await file.text()
	const obj = await mermaidToObject(mermaidText)
	const xstate = xstateObjToxstateJS(obj)
	return xstate
}
