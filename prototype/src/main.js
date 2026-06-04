import { createInitialMap } from './map.js';
import { player } from './player.js';
import { getOpeningEncounter } from './encounters.js';

const state = {
  day: 1,
  phase: 'Dawn',
  map: createInitialMap(5),
  player,
};

const scene = document.querySelector('#scene');
const status = document.querySelector('#status');
const choices = document.querySelector('#choices');

function render() {
  const encounter = getOpeningEncounter();
  scene.textContent = encounter.text;
  status.textContent = `Day ${state.day} / ${state.phase} · HP ${state.player.hp} · Food ${state.player.food} · Map tools ${state.player.mapTools}`;
  choices.innerHTML = '';
  for (const choice of encounter.choices) {
    const button = document.createElement('button');
    button.textContent = choice.text;
    button.addEventListener('click', () => {
      scene.textContent = choice.result;
      choices.innerHTML = '';
    });
    choices.appendChild(button);
  }
}

render();
