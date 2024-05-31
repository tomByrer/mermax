import fs from 'node:fs'
import * as readline from 'node:readline/promises';
import path from "node:path"
import { argv, stdin as input, stdout as output } from 'node:process'
import { mermaidToObject } from "./src/origins/mermaid.js"
import { xstateObjToxstateJS } from "./src/targets/xstate.js"

const rl = readline.createInterface({ input, output })
// https://regexr.com/80sgs
const reFilePath = /^(((?:\.{0,2}\/)?(?:\.?\w+\/)*)([\w.+_-]+(\.?\w+)))$/
// https://regex101.com/r/kQpzzt/1
const reFileName = /(\/?((?<filename>[\w._-]*)*))*/

let cliFilePath, outputPath = ''
if (!argv[2] || !reFilePath.test(argv[2])){
	cliFilePath = await rl.question('Please input path & file for mermax to process:\n? ')
	if (!reFilePath.test(cliFilePath)){
		throw new TypeError("Needs well-formed input file path.")
	}
	outputPath = await rl.question('Please enter output path (empty/malformed = input path):\n? ')
} else {
	cliFilePath = argv[2]
}
const inputPathName = cliFilePath.replace(/.mmd$/, '')
const inputFileName = inputPathName +'.mmd'
console.log('reading: ', inputFileName)
const mermaidText = fs.readFileSync(inputFileName,'utf-8')

const { filename } = reFileName.exec(inputPathName).groups
let outputPathName = inputPathName
if (argv[3] && reFilePath.test(argv[3])) {
	outputPath = argv[3]
} else if (!outputPath || !reFilePath.test(outputPath)){
	outputPath = inputPathName.substring(0, (inputPathName.length - filename.length -1) )
}
outputPathName = outputPath +'/'+ filename
console.log('outputPath',outputPath)
if (!fs.existsSync(outputPath)){
	console.log('creating folder:', outputPath)
	fs.mkdirSync(outputPath);
}

// // takes raw mermaidJS state diagram & translates into transitory object
// const objectFSM = mermaidToObject(mermaidText)
// const jsonFileName = outputPathName +'.json'
// fs.writeFileSync(jsonFileName, JSON.stringify( objectFSM, null, 2),  (err) => {
// 	if (err) throw err;
// });
// console.log(jsonFileName +' 💾 written to file')

// takes raw mermaidJS state diagram & translates into XState machine configuration
const jsFileName = outputPathName +'.machine.js'
fs.writeFileSync(jsFileName, xstateObjToxstateJS( mermaidToObject(mermaidText)),  (err) => {
	if (err) throw err;
});
console.log(jsFileName +' 💾 written to file')
process.exit()  // hack to fix some weird readline bug in Bun
