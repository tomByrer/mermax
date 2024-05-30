
Mermax takes a [MermaidJS](https://mermaid.js.org/syntax/stateDiagram.html) 'text' diagram, then transforms it into JavaScript code for a Finite State Machine / Statechart runable in [XState](https://stately.ai/docs/xstate).  Save time over hand-coding both seperately.


## Transformation Visualization:



## Concurent/Parallel States

##### MermaidJS

```md
stateDiagram-v2
id coffee
%% https://stately.ai/docs/parallel-states#parallel-ondone-transition
[*] --> preparing

state preparing {
	id grindBeans
	[*] --> grindingBeans
	grindingBeans --> beansGround : BEANS_GROUND
	beansGround --> [*]
	--
	id boilWater
	[*] --> boilingWater
	boilingWater --> waterBoiled : WATER_BOILED
	waterBoiled --> [*]
}
preparing --> noCoffee : onDone %%; if: error
preparing --> makingCoffee : onDone
noCoffee
makingCoffee
```

###### XState
```ts
import { createMachine } from "xstate";

export const machinecoffee = createMachine({
	id: "coffee",
	initial: "preparing",
	states: {
		preparing: {
			id: "",
			type: "parallel",
			onDone: [
				{
					target: "noCoffee",
					guard: {
						type: "error"
					}
				},
				{
					target: "makingCoffee"
				}
			],
			states: {
				grindBeans: {
					id: "grindBeans",
					initial: "grindingBeans",
					states: {
						grindingBeans: {
							on: {
								BEANS_GROUND: {
									target: "beansGround"
								}
							}
						},
						beansGround: {
							type: "final"
						}
					}
				},
				boilWater: {
					id: "boilWater",
					initial: "boilingWater",
					states: {
						boilingWater: {
							on: {
								WATER_BOILED: {
									target: "waterBoiled"
								}
							}
						},
						waterBoiled: {
							type: "final"
						}
					}
				}
			}
		},
		noCoffee: {},
		makingCoffee: {}
	}
},
{
	actions: {
	},
	actors: {},
	guards: {
		error: ({ context, event }, params) => {
			return false;
		},
	},
	delays: {},
}
);
```