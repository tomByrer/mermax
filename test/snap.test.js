import { test, expect } from "bun:test"
import { Glob } from "bun"
import * as processFile from "./process-file.bun"

const glob = new Glob(`./test/mmd/*.mmd`)
const reFileName = /(\/?((?<filename>[\w._-]*)*))*/

for await (const fullFilePath of glob.scan()){
	const {filename} = reFileName.exec(fullFilePath).groups
	console.log(filename)

	test(`${filename} to Object FSM`, ()=>{
		expect( processFile.mmdToObjectFSM(fullFilePath) ).resolves.toMatchSnapshot()
	})

	test(`${filename} to Xstate`, ()=>{
		expect( processFile.mmdToXstate(fullFilePath) ).resolves.toMatchSnapshot()
	})
}
