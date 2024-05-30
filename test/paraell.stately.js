// https://stately.ai/docs/parallel-states#parallel-ondone-transition
import { createMachine } from "xstate";

export const machine = createMachine({
  id: "coffee",
  initial: "preparing",
  states: {
    preparing: {
      states: {
        grindBeans: {
          initial: "grindingBeans",
          states: {
            grindingBeans: {
              on: {
                BEANS_GROUND: {
                  target: "beansGround",
                },
              },
            },
            beansGround: {
              type: "final",
            },
          },
        },
        boilWater: {
          initial: "boilingWater",
          states: {
            boilingWater: {
              on: {
                WATER_BOILED: {
                  target: "waterBoiled",
                },
              },
            },
            waterBoiled: {
              type: "final",
            },
          },
        },
      },
      type: "parallel",
      onDone: {
        target: "makingCoffee",
      },
    },
    makingCoffee: {},
  },
});

