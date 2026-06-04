export function getOpeningEncounter() {
  return {
    id: 'tutorial_avalanche_wake',
    text: 'Snow presses against your ribs. Somewhere below it, a map case has survived.',
    choices: [
      {
        text: '몸을 일으키려 애쓴다',
        result: 'Pain answers first, but breath follows. You are alive, and the mission remains.',
      },
      {
        text: '눈을 감고 잠에 든다',
        result: 'The cold takes the last of your resolve. Hannibal never receives a route.',
      },
    ],
  };
}
