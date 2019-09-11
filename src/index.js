//https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3

import { mat4, vec3 } from "./lib/gl-matrix";
import SoundEffect from "./sound-effect";
import {
  oneOrMinusOne,
  randomFloatBetween,
  randomIntBetween,
} from "./webgl-helpers";
import Dome from "./dome";
import Explosion from "./explosion";
import Missile from "./missile";
import Moon from "./moon";
import Mountains from "./mountains";
import Cube from "./cube";

import "./index.css";

const game = {};
const EPSILON = 0.01;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl", { premultipliedAlpha: true });

// https://www.khronos.org/webgl/wiki/HandlingContextLost
canvas.addEventListener("webglcontextlost", (event) => event.preventDefault(), false);
canvas.addEventListener("webglcontextrestored", () => configurePrograms(gl), false);
document.body.addEventListener("mouseup", fireMissile, false);
document.body.addEventListener("touchend", fireMissile, false);

const textBox = document.createElement("div");
textBox.classList.add("text")
document.body.appendChild(textBox);
setTimeout(() => displayText("Infinite Missiles"), 1);

const heatBox = document.createElement("div");
heatBox.classList.add("heat")
document.body.appendChild(heatBox);

const gameWidth = 20;
const cameraPos = vec3.create();
const lookAtPos = vec3.create();
const dimensions = [-1, -1];
const nearPlane = 0.1 + EPSILON;
const farPlane = 400.0;
const fov = 15 * Math.PI / 180;
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
const viewProjectionMatrix = mat4.create();
const inverseViewProjectionMatrix = mat4.create();
const GOOD_MISSILE_SPEED = 0.02;
const BAD_MISSILE_SPEED  = 0.0020;
const BG_MISSILE_SPEED = 0.025;
const GOOD_MISSILE_SHAKE_AMOUNT = 0.5;
const BAD_MISSILE_SHAKE_AMOUNT = 3.0;
const GREEN = [0.2, 0.9, 0.2];
const BLUE = [0.2, 0.2, 0.9];
const PURPLE = [0.6, 0.2, 0.8];
const HEAT_RATE = .35;
const MIN_HEAT_RATE = 0.05;
const COOL_RATE = .002;
const MIN_HEAT = .1;
const WAVE_DELAY = 2000;
const launchSfx = new SoundEffect([0,,0.2322,,0.1669,0.8257,0.0746,-0.3726,,,,,,0.4334,0.1887,,0.0804,-0.1996,1,,,,,0.5]);
const badLaunchSfx = new SoundEffect([3,,0.1796,0.2371,0.4295,0.2341,,0.1075,,,,-0.4805,0.8129,,,,,,1,,,,,0.5]);
const bounds = { width: -1, height: -1 };
let scenary = [];
let thingsToFadeOut = [];
let launchMissiles = [];
let domes = [];
let clickCoords = [];
let missileDome = null;
let heat = 1.0;
let gameOver = true;
let wave = 0;
let waveStartTime = null;
let waveUnpaused = false;
let waveDuration = 5000;
let waveNumBadMissiles = 2;
let waveMissileTimes = [];
let waveBadMissileSpeed = BAD_MISSILE_SPEED;
let waveNumBadMissilesRemaining = null;

game.gl = gl;
game.viewMatrix = viewMatrix;
game.projectionMatrix = projectionMatrix;
game.viewProjectionMatrix = viewProjectionMatrix;
game.inverseViewProjectionMatrix = inverseViewProjectionMatrix;
game.drawables = [];


game.camera = { staticPos: vec3.create() };
game.shakeInfo = {
  amplitude: vec3.create(),
  dir: vec3.create(),
  pos: vec3.create(),
}

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.depthFunc(gl.LESS);
// gl.enable(gl.CULL_FACE);
// gl.cullFace(gl.BACK);
configurePrograms(gl);

const townLocations = [[-gameWidth + 4, 0, 0], [0, 0, 0], [gameWidth - 4, 0, 0]];
createDomes();
updateHeatBar();

requestAnimationFrame(update);

function shakeScreen(amount) {
  const { shakeInfo } = game;
  const { amplitude, dir } = shakeInfo;
  const heightBonusShake = bounds.height / 10;
  const MAX_AMP = 1;
  const MAX_HEIGHT_AMP = heightBonusShake;
  vec3.add(amplitude, amplitude, [amount, amount * heightBonusShake, amount]);
  vec3.set(amplitude, Math.min(MAX_AMP, amplitude[0]), Math.min(MAX_HEIGHT_AMP, amplitude[1]), Math.min(MAX_AMP, amplitude[2]));
  vec3.set(dir, oneOrMinusOne(), oneOrMinusOne(), oneOrMinusOne());
}

function generateWave() {
  waveStartTime = null;
  waveNumBadMissiles += 1;
  waveBadMissileSpeed += 0.00025;
  waveDuration += 750;

  waveMissileTimes = [];
  while (waveMissileTimes.length < waveNumBadMissiles) {
    waveMissileTimes.push(randomFloatBetween(0, waveDuration));
  }

  waveMissileTimes = waveMissileTimes.sort((a, b) => b - a);
  waveMissileTimes[0] = waveDuration;
  waveMissileTimes[waveMissileTimes.length - 1] = 0;
}

function unpauseWave() {
  waveUnpaused = true;
}

function pauseWave() {
  waveUnpaused = false;
}

function createDomes() {
  const dome1 = new Dome(game, [townLocations[0][0], townLocations[0][1], townLocations[0][2] - 2], PURPLE);
  const dome2 = new Dome(game, [townLocations[1][0], townLocations[1][1], townLocations[1][2] - 2], GREEN);
  const dome3 = new Dome(game, [townLocations[2][0], townLocations[2][1], townLocations[2][2] - 2], BLUE);
  domes = [dome1, dome2, dome3];
  game.drawables.push(dome1);
  game.drawables.push(dome2);
  game.drawables.push(dome3);

  missileDome = dome2;
}

function updateShake(time) {
  const { shakeInfo } = game;
  const { amplitude, dir } = shakeInfo;
  vec3.scale(amplitude, amplitude, 0.9);

  if (Math.abs(amplitude[0]) <= .001) {
    vec3.set(shakeInfo.pos, 0, 0, 0);
  } else {
    const offset = Math.sin(time / 10000);
    vec3.set(shakeInfo.pos,
      offset * amplitude[0] * dir[0],
      offset * amplitude[1] * dir[1],
      offset * amplitude[2] * dir[2],
    );
  }
}

function update(time) {
  if (domes.every(dome => dome.dead)) endGame();
  resize();
  updateShake(time);
  const { shakeInfo } = game;
  vec3.add(cameraPos, game.camera.staticPos, shakeInfo.pos);
  resetMatrices();
  requestAnimationFrame(update);

  launchPlayerMissiles(time);
  if (!gameOver) launchEnemyMissiles(time);

  game.drawables = game.drawables.filter((drawable) => !drawable.dead);
  waveNumBadMissilesRemaining = game.drawables.filter(d => d.type === "missile" && !d.good);
  heat = Math.min(heat + COOL_RATE, 1);

  checkCollisions(time);
  updateDrawables(time);

  if (waveNumBadMissilesRemaining <= 0 && waveMissileTimes.length === 0 && waveUnpaused) {
    pauseWave();
    wave++;
    generateWave();
    displayWaveNum(3000);
    setTimeout(() => unpauseWave(), WAVE_DELAY);
    const z = -30;
    const numMissiles = waveMissileTimes.length;
    const delay = WAVE_DELAY / numMissiles;
    const launchWidth = bounds.width / 2;
    const launchStartX = - launchWidth / 2;

    for (let i = 0; i < numMissiles; i++) {
      const launchTime = delay * i;
      setTimeout(() => {
        const x = launchStartX + (launchWidth / (numMissiles - 1)) * i;
        const missile = new Missile(
          game,
          time + launchTime,
          [x, 0, z],
          [x, bounds.height * 5.0, z],
          false,
          BG_MISSILE_SPEED,
          true
        );
        launchMissiles.push(missile); // I wish I could use thingsToFadeOut, but I'm all confused on my z-ordering :/
        badLaunchSfx.play();
      }, launchTime);
    }
  }

  scenary.forEach((drawable) => drawable.update(time));
  thingsToFadeOut.forEach((thing) => thing.update(time));
  thingsToFadeOut = thingsToFadeOut.filter((thing) => thing.alpha > 0.0);
  launchMissiles.forEach((missile) => missile.update(time));
  launchMissiles = launchMissiles.filter((missile) => missile.alpha > 0.0);

  draw(time);
}

function endGame() {
  gameOver = true;
  pauseWave();
  displayText("Game Over");
}

function launchEnemyMissiles(time) {
  if (!waveUnpaused) return;
  if (!waveStartTime) waveStartTime = time;
  const timeInWave = time - waveStartTime;
  const nextTime = waveMissileTimes[waveMissileTimes.length - 1];
  if (nextTime < timeInWave) {
    const targetableDomes = domes.filter((dome) => !dome.dead);
    const domeIndex = randomIntBetween(0, targetableDomes.length - 1);
    const targetDome = targetableDomes[domeIndex];
    const halfWidth = bounds.width / 2;
    const launchX = randomFloatBetween(-halfWidth, halfWidth);
    const townToAimAt = vec3.create();
    vec3.copy(townToAimAt, targetDome.position);
    const jitter = randomFloatBetween(-0.1, 0.1);
    townToAimAt[0] += jitter;

    game.drawables.push(
      new Missile(
        game,
        time,
        [launchX, bounds.height, missileDome.position[2]],
        townToAimAt,
        false,
        waveBadMissileSpeed
      )
    );
    waveMissileTimes.pop();
  }
}

function updateDrawables(time) {
  game.drawables.forEach((drawable) => {
    if (drawable.type === "missile") {
      if (drawable.maybeExplode(time)) {
        if (!drawable.good && drawable.percentDone >= 1.0) {
          shakeScreen(BAD_MISSILE_SHAKE_AMOUNT);
        } else {
          shakeScreen(GOOD_MISSILE_SHAKE_AMOUNT);
        }
      }
    }
    drawable.update(time);
  });
}

function launchPlayerMissiles(time) {
  clickCoords.forEach((coords) => game.drawables.push(
    new Missile(game, time, [0, 4.5, missileDome.position[2]], coords, true, GOOD_MISSILE_SPEED)
  ));
  clickCoords = [];
}

function draw(time) {
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  updateHeatBar();
  launchMissiles.forEach((thing) => thing.draw(time));
  scenary.forEach((drawable) => drawable.draw(time));
  thingsToFadeOut.forEach((thing) => thing.draw(time));
  game.drawables.forEach((drawable) => drawable.draw(time));
}

// TODO: Consider space partioning to make this faster
function checkCollisions(time) {
  game.drawables.forEach((drawable) => {
    if (!drawable.collidable) return;
    game.drawables.forEach((otherDrawable) => {
      if (!otherDrawable.collidable) return;
      if (drawable === otherDrawable) return;

      const distance = vec3.distance(drawable.position, otherDrawable.collisionPosition);
      if (distance < (drawable.radius + otherDrawable.radius)) {
        if (
          drawable.type === "explosion" &&
          otherDrawable.type === "missile" &&
          otherDrawable.good === false
        ) {
          otherDrawable.explode(time);
        } else if (
          drawable.type === "dome" &&
          otherDrawable.type === "missile" &&
          otherDrawable.good === false
        ) {
          otherDrawable.explode(time);
          shakeScreen(BAD_MISSILE_SHAKE_AMOUNT);
        } else if (
          drawable.type === "dome" &&
          otherDrawable.type === "explosion"
        ) {
          drawable.hit(time);
        }
      }
    })
  });
}

// https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
function fireMissile(event) {
  if (gameOver) startGame();
  if (!missileDome || missileDome.dead || heat <= MIN_HEAT) return;

  launchSfx.play();
  let touch = event;
  if (event.touches) touch = event.changedTouches[0];
  const worldCoords = unprojectPoint([touch.clientX, touch.clientY], missileDome.position[2]);
  clickCoords.push([worldCoords[0], worldCoords[1], worldCoords[2]]);
  const heatRate = Math.max(HEAT_RATE - wave * .01, MIN_HEAT_RATE);
  heat = Math.max(heat - heatRate, 0);
}

function unprojectPoint(point, z = 0) {
  const screenX = point[0];
  const screenY = point[1];
  const x = (screenX / canvas.clientWidth) * 2 - 1;
  const y = -(screenY / canvas.clientHeight) * 2 + 1;

  const coords = [x, y, 0];
  const worldCoords = vec3.create();

  vec3.transformMat4(worldCoords, coords, inverseViewProjectionMatrix);
  vec3.subtract(worldCoords, worldCoords, cameraPos);
  vec3.normalize(worldCoords, worldCoords);
  const distance = (z - cameraPos[2]) / worldCoords[2];
  vec3.scale(worldCoords, worldCoords, distance);
  vec3.add(worldCoords, worldCoords, cameraPos);
  // console.log("screen: ", point);
  // console.log("clip: ", [x, y]);
  // console.log("world: ", worldCoords);
  return worldCoords;
}

function startGame() {
  gameOver = false;
  thingsToFadeOut = game.drawables.filter((drawable) => drawable.type === "missile");
  thingsToFadeOut.forEach((thing) => thing.dead = true);
  game.drawables = [...domes];
  wave = 0;
  waveStartTime = null;
  waveDuration = 5000;
  waveNumBadMissiles = 2;
  waveMissileTimes = [];
  waveBadMissileSpeed = BAD_MISSILE_SPEED;
  waveNumBadMissilesRemaining = null;
  domes.forEach(dome => dome.reset());
  hideText(1000);
  setTimeout(unpauseWave, 1500);
}

function displayWaveNum(delay = 0) {
  displayText(`Wave ${wave}`, delay);
  hideText(delay * 2);
}

function resetCamera() {
  vec3.set(cameraPos, 0, 0, 1);
  vec3.set(lookAtPos, 0, 0, -1);
  resetMatrices();
}

function resize() {
  const height = window.innerHeight;
  const width = window.innerWidth;
  const heightString = `${height}px`;
  const widthString = `${width}px`;

  canvas.height = height;
  canvas.width = width;
  document.body.style.height = heightString;
  document.body.style.width = widthString;
  document.documentElement.style.height = heightString;
  document.documentElement.style.width = widthString;

  if ((dimensions[0] === width && dimensions[1] === height)) return;
  window.scrollTo(0, 0);
  gl.viewport(0, 0, width, height);

  resetProjectionMatrix();
  resetCamera();

  dimensions[0] = width;
  dimensions[1] = height;

  // Size the horizontal bounds by adjusting z postion of the camera
  const worldBounds = unprojectPoint([width, height]);
  const z = Math.min(gameWidth / worldBounds[0], farPlane);
  vec3.set(cameraPos, 0, 0, z);
  vec3.set(lookAtPos, 0, 0, -1);
  resetMatrices();

  // Move 0 on the y-axis to the bottom of the screen
  const bottomOfWorld = unprojectPoint([width, height]);
  bounds.width = Math.abs(bottomOfWorld[0] * 2);
  bounds.height = Math.abs(bottomOfWorld[1] * 2);
  const heatBarOffset = bounds.height * .04 + 1;
  const y = -bottomOfWorld[1] - heatBarOffset;
  vec3.set(cameraPos, 0, y, z);
  vec3.copy(game.camera.staticPos, cameraPos);
  vec3.set(lookAtPos, 0, y, -1);
  resetMatrices();

  // Reset scenary
  scenary = [];

  // Reset stars
  let numStars = 200;
  const mountainY = bounds.height * .2;

  for (let i = 0; i < numStars; i++) {
    const x = randomFloatBetween(-bounds.width, bounds.width);
    const y = randomFloatBetween(mountainY, bounds.height * 1.5);
    const z = randomFloatBetween(-50, -80);
    const star = new Moon(game, [x, y, z], true);
    scenary.push(star);
  }

  // Place moon
  const moon = new Moon(game, [0, 0, 0]);
  scenary.push(moon);

  const radius = gameWidth * .1;
  moon.radius = radius;
  const topRightOfWorld = unprojectPoint([width * .9, height * .1]);
  vec3.set(moon.position, topRightOfWorld[0], topRightOfWorld[1], 0);;

  // Reset mountains
  const mountainHeight = (bounds.height - mountainY) * .66;
  const mountainStart = -bounds.width / 2 - bounds.width * .25;
  const mountainEnd = bounds.width + bounds.width * .25;
  const mountainZ = 20;

  const mountains1 = new Mountains(game, [mountainStart, 0, -mountainZ + 0], [mountainEnd, mountainHeight * 1.0, 0], [0.0, 0.3, 0.5]);
  const mountains2 = new Mountains(game, [mountainStart, 0, -mountainZ + 1], [mountainEnd, mountainHeight * 0.7, 0], [0.0, 0.5, 0.5]);
  const mountains3 = new Mountains(game, [mountainStart, 0, -mountainZ + 2], [mountainEnd, mountainHeight * 0.3, 0], [0.0, 0.4, 0.5]);
  scenary.push(mountains1);
  scenary.push(mountains2);
  scenary.push(mountains3);

  // Reset ground
  const groundDepth = mountainZ;
  const ground = new Cube(game, [0, -1, 0], [2 * bounds.width, 1, groundDepth]);
  scenary.push(ground);

  // Add buildings
  domes.forEach((dome) => {
    dome.buildings = [];
    let distance = 0;
    const x = dome.position[0] - dome.radius + dome.radius * .2;
    const z = dome.position[2]
    const width = .5;
    const maxDistance = dome.radius * 2 - 5 * width;
    while (distance < maxDistance) {
      distance += randomFloatBetween(.5, 1);
      const height = randomFloatBetween(0.5, 1.4);
      const building = new Cube(game, [x + distance, height, z], [width, height, width], true);
      scenary.push(building);
      dome.buildings.push(building);
    }

    dome.buildings[0].dimensions[1] = 0.7;
    dome.buildings[0].position[1] = 0.7;
    dome.buildings[dome.buildings.length - 1].dimensions[1] = 0.6;
    dome.buildings[dome.buildings.length - 1].position[1] = 0.6;
  });
}

function resetMatrices() {
  resetViewMatrix();
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);
}

function resetViewMatrix() {
  mat4.identity(viewMatrix);
  mat4.lookAt(viewMatrix, cameraPos, lookAtPos, [0.0, 1.0, 0.0]);
}

function resetProjectionMatrix() {
  mat4.identity(projectionMatrix);
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  mat4.perspective(projectionMatrix, fov, aspectRatio, nearPlane, farPlane);
}

function configurePrograms(gl) {
  Dome.configureProgram(gl);
  Explosion.configureProgram(gl);
  Missile.configureProgram(gl);
  Moon.configureProgram(gl);
  Mountains.configureProgram(gl);
  Cube.configureProgram(gl);
}

function displayText(text, delay = 0) {
  setTimeout(() => {
    textBox.innerText = text;
    textBox.style.opacity = 1.0;
  }, delay);
}

function hideText(delay = 0) {
  setTimeout(() => textBox.style.opacity = 0.0, delay);
}

function updateHeatBar() {
  const greenWidth = `${heat * 100}%`;
  const redWidth = `${(1 - heat) * 100}%`;
  heatBox.style.background = `linear-gradient(to right, rgb(0, 115, 115) ${greenWidth}, rgb(200, 35, 106) ${greenWidth} ${redWidth})`;

}

// Disable scrolling
window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });