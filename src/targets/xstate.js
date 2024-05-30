/*
	Take State Machine Object Notation & transpile to XState JavaScript
	fsmObjToXstateObj() = main()
*/

/**
 * Transforms Object State Machine into XState JavaScript file.
 * 
 * (Output may need additional hand coding for fucntions.)
 * 
 * @param {Object} Object State Machine.
 * 
 * @return {string} XState JavaScript file.
*/
export function xstateObjToxstateJS(obj, options={typescript: false,}){
	let global = {
		events: new Set(), // for types
		actions: new Set(),
		actors: {},
		delays: {},
		guards: new Set(),
	}

	function transformState(input) {
		// used for FINIS states; where a multi-event state also has final state
		if (input==='final'){
			return {
				type: 'final'
			}
		}

		// regex101.com/r/i5jNuU/8
		const mscRE = /^(?:"?(?<event>\w+(?: \w+)*(?:--\w+(?: \w+)*)?)"?)?(?:~~(?:if:\s?"?(?<if>\w+(?: \w+)*)"?)?(?: , )?(?:type:\s?(?<type>"?\w+(?: \w+)*"?))?(?: , )?(?:action:\s?(?<action>"?\w+(?: \w+)*"?))?)?/
		let result = {}
		let eventNames = [] // temp tracker for duplicates
		for (
			let i=0,
				keys = Object.keys(input);
			i<keys.length;
			i++
		){
			const value = input?.[keys[i]] ?? null
			const tempObj = {target:value}

			const matches = keys[i].match(mscRE).groups
			if (matches.if){
				tempObj['guard'] = {type: matches.if}
				global.guards.add(matches.if)
			}
			if (matches.action){
				tempObj['actions'] = {type: matches.action}
				global.actions.add(matches.action)
			}
			// XState treats 'onDone' as unique event; but some conventions might capitalize all events
			const event = matches.event
			// force duplicate events into array if has guard(s) + multiple targets
			if (eventNames.includes(event)){
				if (Array.isArray(result[event])){ // more than 1 event?
					result[event].push(tempObj)
				}
				else {
					result[event] = [ result[event], tempObj ]
				}
			}
			else { // onDone likely
				eventNames.push(event)
				Object.assign(result, { [event]: tempObj })
			}
		}

		global.events.add(...eventNames)

		return {on: result}
	}

	// main()
	function fsmObjToXstateObj(input){
		// 1st root-parent level, which ignores children
		let root = {
			id: input.id,
		}
		if (input.isConcurrent){
			root.type = 'parallel'
			root.onDone = [] // placed here for ordering
		}
		else { // parallel do not have initial, but each internal parallel state should
			root.initial = input.initial
		}
		root.states = {} // states after 'parallel' type please

		Object.keys(input.states).forEach((key)=>{
			const value = input.states[key]

			root.states[key] = (value?.states) // is child
				? fsmObjToXstateObj(value)
				: (value)
					?	transformState(value)
					: {}
		})

		if (input.final){
	//console.log('x-final', input.final)
			for (let i=0; i < input.final.length; i++) {

			}
		}

		// prep to find onDone & straggler events
		delete input.id
		delete input.initial
		delete input.isConcurrent
		delete input.final
		delete input.states
		if (Object.keys(input).length > 0){ // maybe transtions attached directly to state that are not under 'states:' are onDone
			const {on} = transformState(input)
//console.log('last Events', Object.keys(input), on)
			if (on?.onDone)
				root.onDone = on.onDone
			else
				root.on = on
		}

		return root
	}

	function objFormatStr(obj){
		return JSON.stringify( obj, null, '\t')
		.replace(/"\w+":/g, match => match.replace(/"/g, ''))
	}
	function strFormatQuotes(str){
		return (str.includes(' '))
			? `"${str}"`
			: str
	}

	const result = fsmObjToXstateObj(obj)

	let strOut = ""
	if (options.typescript){
		result['types'] = "-REPLACEME-"
		let eventTypes = []
		for (let value of global.events) {
			eventTypes.push(`{ type: "${value}" } `)
		}
		const replaceme = `{ events: {} as ${eventTypes.join('| ')} }`
		strOut = objFormatStr(result).replace(/"-REPLACEME-"/g, replaceme)
	}
	else {
		strOut = objFormatStr(result)
	}

	// not add implemeantion section
	strOut += `,
{
	actions: {
	`
	for (let value of global.actions) {
		strOut += `	${strFormatQuotes(value)}: ({ context, event }) => {}
	`
	}
	strOut += `},
	actors: {},
	guards: {
	`
	for (let value of global.guards) {
		strOut += `	${strFormatQuotes(value)}: ({ context, event }, params) => {
			return false;
		},
	`
	}
	strOut += `},
	delays: {},
}`

	let events = new Set(global.events)

	return `import { createMachine } from "xstate";

export const machine${result.id.replace(/[\s-_]/g, '')} = createMachine(${
	strOut
}
);
`
}
