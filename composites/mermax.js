import { mermaidToObject } from "../src/origins/mermaid.js"
import { xstateObjToxstateJS } from "../src/targets/xstate.js"

export function mermax(mermaidText){
	return xstateObjToxstateJS( mermaidToObject(mermaidText) )
}
