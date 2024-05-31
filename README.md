

# Mermex

Instantly* transform your [MermaidJS](https://mermaid.js.org/syntax/stateDiagram.html) into a Finite State Machine / Statechart into actual code you can run in [XState](https://stately.ai/docs/xstate)!  Save time over hand-coding both seperately.

*OK a bit of a strech here; not 'instant', you do have to run this script, taking a few ms of your time.  & the output is missing functions, might have some bugs, but gets you 70% of the way there!

## Example

<video src="https://private-user-images.githubusercontent.com/1308419/335180957-6fd354ed-2759-4298-809c-09e4a6331357.mp4?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTcwNzI3NTUsIm5iZiI6MTcxNzA3MjQ1NSwicGF0aCI6Ii8xMzA4NDE5LzMzNTE4MDk1Ny02ZmQzNTRlZC0yNzU5LTQyOTgtODA5Yy0wOWU0YTYzMzEzNTcubXA0P1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDUzMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDA1MzBUMTIzNDE1WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9OGRjYzg2ZWFlOWE2MGE0ZjFhZDMxMGU5NTE2MWI4ZTA3YjQ1Yzc1MDUyMmVkYmI5YmQ0ODg0MjVhZmQ3MjcyMyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.mvVbeXm5C85_vd7LBGbDQTVlfIRjSEykKDGmR21bgzs" data-canonical-src="https://private-user-images.githubusercontent.com/1308419/335180957-6fd354ed-2759-4298-809c-09e4a6331357.mp4?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTcwNzI3NTUsIm5iZiI6MTcxNzA3MjQ1NSwicGF0aCI6Ii8xMzA4NDE5LzMzNTE4MDk1Ny02ZmQzNTRlZC0yNzU5LTQyOTgtODA5Yy0wOWU0YTYzMzEzNTcubXA0P1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDUzMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDA1MzBUMTIzNDE1WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9OGRjYzg2ZWFlOWE2MGE0ZjFhZDMxMGU5NTE2MWI4ZTA3YjQ1Yzc1MDUyMmVkYmI5YmQ0ODg0MjVhZmQ3MjcyMyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.mvVbeXm5C85_vd7LBGbDQTVlfIRjSEykKDGmR21bgzs" controls="controls" muted="muted" class="d-block rounded-bottom-2 border-top width-fit" loop style="max-height:640px; min-height: 200px">
</video>

<details>
<summary>Click to show text example.</summary>

### 1: Mermaid State Diagram

Similar to Markdown, MermaidJS is a simple text format for basic diagrams.

Start & end points are flagged with `[*]`, `%%` preceed comments, and colins `:` flag an event (named transition).

Below is a simple example from [MermaidJS docs](https://mermaid.js.org/syntax/stateDiagram.html), used as a source.

```go ! mermaid.mmd
stateDiagram-v2
id mermaidJS state diagram
%% inspiration: https://mermaid.js.org/syntax/stateDiagram.html
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still : STOP %% named transition / event
Moving --> Crash
Crash --> [*]
```

### 2: Object State Machine

Mermex takes the MermaidJS text file, then translates it into an "Object State Machine", an intermediate notation that is not meant to consumed directly (though still human readable).

If there are no specified named transitions (events) in the Mermaid source, then programmically one is assigned with `[source]--[target]` nominclature.

```json ! mermaid.osm.json
{
  "final": [
    "Still",
    "Crash",
  ],
  "id": "mermaidJS state diagram",
  "initial": "Still",
  "isConcurrent": false,
  "states": {
    "Still": {
      "Still--FINIS": "FINIS",
      "Still--Moving": "Moving",
    },
    "Moving": {
      "STOP": "Still",
      "Moving--Crash": "Crash",
    },
    "Crash": {
      "Crash--FINIS": "FINIS",
    },
    "FINIS": "final",
  },
}
```

### 3: XState JavaScript

Finally, the OSM has been transformed into executable code for [XState](stately.ai).

Note: to create a "final" state for states that have more than one event, a state named "FINIS" is created to be assigned `type: "final"`

```js ! mermaid.xstate.js
import { createMachine } from "xstate";

export const machinemermaidJSstatediagram = createMachine({
  id: "mermaidJS state diagram",
  initial: "Still",
  states: {
    Still: { on: {
      "Still--FINIS": {
        target: "FINIS"
      },
      "Still--Moving": {
        target: "Moving"
    } } },
    Moving: { on: {
      STOP: {
        target: "Still"
      },
      "Moving--Crash": {
        target: "Crash"
    } } },
    Crash: { on: {
      "Crash--FINIS": {
        target: "FINIS"
    } } },
    FINIS: {
      type: "final"
    }
} });
```

</details>


## Usage

Clone/download this repo, then try out the examples MermaidJS in `test/mmd`.  You can use either [NodeJS](https://nodejs.org/) or [Bun](https://bun.sh/) to run `mermex-cli.js`
```
❯ bun run mermex-cli.js
Please input path & file for mermax to process:
? test/mmd/mermaid.mmd
Please enter output path (empty/malformed = input path):
? test/xstate
creating folder: test/xstate
test/xstate/mermaid.machine.js 💾 written to file
```
*NOTE*: the CLI is a helper & example on how to use the files in the `/src` folder.  If you want to use them in your own project, copy the contents of `/src` into your own project, then

```js
import { mermaidToObject } from "YOURPATH/src/origins/mermaid.js"
import { xstateObjToxstateJS } from "YOURPATH/src/targets/xstate.js"
...
const xstateProgram = xstateObjToxstateJS( mermaidToObject(mermaidText) )
```

## Supported Features

### [MermaidJS state diagram](https://mermaid.js.org/syntax/stateDiagram.html) as source

Supported:
  + Composite states (also called "children")
  + named transitions (also called "events"; without names the default is `SOURCE--DESTINATION`)
  + comments, both inline & End Of Line
  + Concurrency ("parallel states")
  + Start ("initial") and End ("type: final", may need `FINIS` state)

NOT Supported:
  - `<<choice>>`, workaround: use `, if: guardName` (note comma)
  - `<<fork>>` (use `if` conditions)
    - `<<join>> `(simply target the same state)
  - anything GUI; note, direction, classDefs

### XState as target

Supported:
  + FSM, much of Statecharts
  + Events and transitions
  + Initial & Final (FINIS) states
  + Parent/Children states
  + Parallel states, including onDone transition

NOT Supported (yet)
  - Context
  - functions for actions

### Maybe-future

"State Machine Rosetta Stone", multiple source & desination formats


## Tech notes

 * 0 (no) Dependencies for mermex, only for CLI file I/O, & testing
 * `bun test` to test against snapshots, `bun test --update-snapshots` if you change behavour
