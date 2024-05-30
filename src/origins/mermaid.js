/*
	read text markup Mermaid.js state, output object for FSM/behavor tree production
	mermaidToObject() = main()
*/
//fix null in final:()

// https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6?permalink_comment_id=3889214#gistcomment-3889214
function merge(source, target) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      target[key] ??=new val.__proto__.constructor();
      merge(val, target[key]);
    } else {
			switch (key) {
				case 'id':
					target.id = target?.id || source?.id //todo warn if overwrite with 2nd initial
					break
				case 'initial':
					target.initial = target?.initial || source?.initial //todo warn if overwrite with 2nd initial
					break
				case 'final':
					(source.final && target.final) ? target.final.concat(source.final) : target?.final ?? source.final
				default:
					target[key] = val
			}
    }
  }
  return target; // replace in-situ; more for chaining than anything else
}
function mergetLevel(temp, target, breadcrumbLevel=[]){ // temp into target
	// if (breadcrumbLevel.length){  //todo needed?
		for (let i=breadcrumbLevel.length-1; i>-1; i--) {
//FIXME
			const tName = (breadcrumbLevel[i].startsWith('=Parallel') && !(temp?.id === ""))
				? temp.id
				: breadcrumbLevel[i]
			// const tName = breadcrumbLevel[i]
			temp = { [tName]: temp }
			temp = { states: temp }
//console.log('mergeLevel', i, breadcrumbLevel[i], '~~', JSON.stringify(temp, null, 2));
		}
	// }

		return {
			id: target?.id || temp?.id, //todo warn if overwrite with 2nd initial
			initial: target?.initial || temp?.initial, //todo warn if overwrite with 2nd initial
			final:  (temp.final && target.final) ? target.final.concat(temp.final) : target?.final ?? temp.final,
			isConcurrent: target.isConcurrent || temp.isConcurrent,
			states: (target?.states && temp?.states) ? merge(temp.states, target.states) : target?.states || temp.states,
		}

}

/*
	adds 'final' states if needed
	{
		machine: { initial: "", states: (), final: []},
		stateCounts: [ stateName: [int, int],...]
	}
*/
function finalizeLevel(obj){
//console.log()
//console.log(`finalizeLevel`, obj)
	const OMFinal = obj.machine.final
	if (OMFinal === undefined || OMFinal.length === 0) {
		// noop
	}
	// true single FINAL, without guards, multiple inlets, etc
	else if ( OMFinal.length == 1 && !(obj.machine['states'][OMFinal[0]])) {
//console.log('final1: ', OMFinal[0])
		// if ( !(OMFinal[0] in obj.stateCounts) ) {
			obj.machine['states'][OMFinal[0]] = "final"
		// }
		//fixme ? multi final, but all edd-ends?
	}
	// multi final, so make a true final state
	else {
		//fix: check if there is transistion name
		for (const f of OMFinal) {
			if (!obj.machine.states[f]) { obj.machine.states[f] = {} }
			const e = f +'--FINIS'
			obj.machine.states[f][e] = 'FINIS'
		}
		obj.machine.states.FINIS = "final"
	}

	return obj.machine
}
function finalize(machine, stateCounts){
	// 1st root-parent level, which ignores children
	let stateMachineObjectModel = finalizeLevel({machine, stateCounts})

	for (const [key, value] of Object.entries(machine.states)) {
		// isChild?
		if (value?.states) { // has child
			finalize(value, stateCounts)
		}
	}
	return stateMachineObjectModel
}

/**
 * Transforms MermaidJS state diagram into Object State Machine.
 * 
 * (Output is meant to be transformed into other target code.)
 * 
 * @param {string}  mermaidText .MermaidJS text file.
 * 
 * @return {Object} Object State Machine.
*/
export function mermaidToObject(mermaidText) {
	// https://regex101.com/r/3WMccA/16 by me; same copyright
	const reMDFSM = /(?:(?:"?(?<source>\w+(?:[ -_]\w+)*)"?|(?<start>\[\*\]))(?: --> )(?:"?(?<target>\w+(?:[ -_]\w+)*)"?(?: : (?<event>\w+|("\w+([ -_]\w+)*)"))?(?: %%; (?<msc>.+))?|(?<end>\[\*\])))|(?<compositeEnd>}|--)|(state "?(?<composite>\w+(?:[ -_]\w+)*)"? {)|(?:(?<!\S )id (?<id>\w+(?:[ -_]\w+)*))|(?<declaration>stateDiagram-v2)|%%\s*(?<comment>.+)|"?(?<leaf>\w+(?:[ -_]\w+)*)"?/gm
	const matches = [...mermaidText.matchAll(reMDFSM)]

	const initLevel = { id: "", initial:"", final:[], isConcurrent: false, states:{}, } // final = sources of endings
	let result = structuredClone(initLevel)
	//TODO error mulitple initial states
	let tLevel = structuredClone(initLevel) // temp for current level (depth of parent/child) of recursive depth
	// tracking times a state has outbound events (1st int) or inbound (2nd int)
	// needed to prove a final state is truly final
	let stateCounts = {} // stateName: [int, int]  // NOT counting init or final, [out bound, in bound]
	let compositeList = []  // tracks all children machine names
	let breadcrumbLevel = [] // tracks child machine branch level, empty = root/main
////console.log('matches.', matches) //! long
	let isConcurrent = false
	for (let i=0; i<matches.length; i++) {
		const G = matches[i].groups
		let e = G.event
		// let logNote = ``

		function newChildLevel(id, rule='push only'){
//console.log('nCL: ', id, breadcrumbLevel.length, breadcrumbLevel)
			// how nested in children is current state?
			switch (breadcrumbLevel.length) {
				case 0: // at root/parent?
// 					logNote += `
// 0 G.composite bcL: ${breadcrumbLevel}`
					result = mergetLevel(tLevel, result) // save prior progress
					break
// 				case 1: // direct child of parent
// // 					logNote += `
// // 1 G.composite bcL: ${breadcrumbLevel}
// // child is ${{[breadcrumbLevel[0]]: tLevel}}`
// 					result.states[breadcrumbLevel[0]] = tLevel
// 					break
				default: // nested children
// 					logNote += `
// NESTED G.composite bcL: ', ${breadcrumbLevel}`
					result = mergetLevel(tLevel, result, breadcrumbLevel)
			}

			// if (rule = 'pop then push'){
			// 	breadcrumbLevel.pop()
			// }
			breadcrumbLevel.push(id)
			compositeList.push(id)
//console.log('nCL mid: ', id, breadcrumbLevel.length, breadcrumbLevel, tLevel)
			tLevel = structuredClone(initLevel) // new temp deeper,
//console.log('nCL END: ', id, breadcrumbLevel.length, breadcrumbLevel, tLevel)
		}

		function nameParallel(int){
			return '=Parallel'+ String(int).padStart(3, '0')
		}

		let matchGroups = {}
		for (let [key, value] of Object.entries(G)) {
			if (!(!value)) { // display only matches (not undefined)
				matchGroups[key] = value
			}
		}

//console.log('\r', i, ':', matchGroups)

		// parse the RegEx result
		// `here --> there`
		if (G.source && G.target) {
			if (!e) { e = G.source +`--`+ G.target}
			if (G.msc) ( e += `~~`+ G.msc )
			if (!tLevel.states[G.source]) { tLevel.states[G.source] = {} }
			tLevel.states[G.source][e] = G.target

			if (!stateCounts[G.source]) { stateCounts[G.source] = [0, 0] }
			stateCounts[G.source][0] += 1
			if (!stateCounts[G.target]) { stateCounts[G.target] = [0, 0] }
			stateCounts[G.target][1] += 1
//console.log(G.source, '-->', G.target, stateCounts, tLevel.states)
		}
		// `ending --> [*]`
		else if (G.source && G.end) {
			tLevel.final.push(G.source)
//console.log('G.end', breadcrumbLevel, tLevel)
		}
		// `[*] --> firstState`
		else if (G.start && G.target) {
			tLevel.initial = G.target
//console.log('start', tLevel)
		}
		// XState likes an ID value for all machines; helps with targeting
		else if (G.id) {
			tLevel.id = G.id //todo check for dupes
		}
		// state that has no events nor targets nor is "end state"
		else if (G.leaf) {
			if (!tLevel.states[G.leaf]) { tLevel.states[G.leaf] = null }
		}
		// } (closes nested state), -- (concurrent/paralel child )
		else if (G.compositeEnd){
//console.log(`G.compositeEnd`, breadcrumbLevel, isConcurrent, tLevel)

			if (G.compositeEnd === '}'){
				if (isConcurrent){
					newChildLevel(nameParallel(i))
						breadcrumbLevel.pop()
						breadcrumbLevel.pop()
					}
				else {
					result = mergetLevel(tLevel, result, breadcrumbLevel)
					breadcrumbLevel.pop() //keep for pop()
					tLevel = structuredClone(initLevel)
				}
			}
			else { // (G.compositeEnd === '--'){
					// 2 IDs, & 2 IDs in a row?

				if (isConcurrent){
					breadcrumbLevel.pop()
				}
				else {
					// branch the concurrent state
					let concurrentLevel = structuredClone(initLevel)
					concurrentLevel.isConcurrent = true
					result = mergetLevel(concurrentLevel, result, breadcrumbLevel)
				}
				breadcrumbLevel.push(nameParallel(i))
				compositeList.push(nameParallel(i))
				result = mergetLevel(tLevel, result, breadcrumbLevel)
				breadcrumbLevel.pop()
////console.log('--- bcL:', breadcrumbLevel)
				breadcrumbLevel.push(nameParallel(i+1))
				compositeList.push(nameParallel(i+1))
				tLevel = structuredClone(initLevel)
				isConcurrent = true
			}
			// else if (isConcurrent && G.compositeEnd === '--'){ NoOp }

//console.log(`G.compositeEnd post`, breadcrumbLevel, isConcurrent, tLevel)
		}
		// `state Child {` ~ starting a new state-group
		// break out of else chain; might be created by isConcurrent
		else if (G.composite) {
			newChildLevel(G.composite) //todo test me
		}
// 		else if (G.msc) {
// // 			logNote += `
// // 'msc' not implemented yet.
// // `
// 		}
// 		else {
// // 			logNote += `
// // no match`
// 		}
	}

	result = mergetLevel(tLevel, result) // save the last root-level progress

	return finalize(result, stateCounts)
}
