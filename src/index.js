//https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3

import TinyMusic from "./lib/tinymusic";
import { mat4, vec3 } from "./lib/gl-matrix";
import {
  oneOrMinusOne,
  randomFloatBetween,
  randomIntBetween,
} from "./webgl-helpers";
import { UNIFORM_NAMES } from "./models";
import Dome from "./dome";
import Explosion from "./explosion";
import Missile from "./missile";
import Moon from "./moon";
import Cube from "./cube";

import "./index.css";

const game = {};
const EPSILON = 0.0001;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl", { premultipliedAlpha: true });

// https://www.khronos.org/webgl/wiki/HandlingContextLost
canvas.addEventListener("webglcontextlost", (event) => event.preventDefault(), false);
canvas.addEventListener("webglcontextrestored", () => configurePrograms(gl), false);


document.body.addEventListener("pointerup", fireMissile, false);
document.body.addEventListener("touchend", fireMissile, false);

console.log(TinyMusic);

const gameWidth = 20;
const cameraPos = vec3.create();
const lookAtPos = vec3.create();
const dimensions = [-1, -1];
const nearPlane = 0.1 + EPSILON;
const farPlane = 400.0;
const fov = 20 * Math.PI / 180;
const viewMatrix = newViewMatrix();
const projectionMatrix = newProjectionMatrix();
const viewProjectionMatrix = mat4.create();
const inverseViewProjectionMatrix = mat4.create();
const GOOD_MISSILE_SPEED = 0.019;
const BAD_MISSILE_SPEED = 0.0025;
const GOOD_MISSILE_SHAKE_AMOUNT = 1.0;
const BAD_MISSILE_SHAKE_AMOUNT = 3.0;
const GREEN = [0.2, 0.9, 0.2];
const RED = [0.9, 0.2, 0.2];
const BLUE = [0.2, 0.2, 0.9];
const GOLD = [1.0, 0.84, 0.0];
const PURPLE = [0.6, 0.2, 0.8];

game.gl = gl;
game.viewMatrix = viewMatrix;
game.projectionMatrix = projectionMatrix;
game.viewProjectionMatrix = viewProjectionMatrix;
game.inverseViewProjectionMatrix = inverseViewProjectionMatrix;
game.drawables = [];
game.scenary = [];
game.clickCoords = [];
game.timeLastBadMissileFiredAt = 0;
game.minTimeBetweenBadMissiles = 1000;
game.missileSpeedMultiplier = 1.0;
game.chanceOfBadMisslesFiring = 0.1;
game.bounds = { width: -1, height: -1 };
game.camera = { staticPos: vec3.create() };
game.shakeInfo = {
  amplitude: vec3.create(),
  dir: vec3.create(),
  pos: vec3.create(),
}

mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
// gl.enable(gl.DEPTH_TEST);
// gl.depthFunc(gl.NEVER);

// gl.enable(gl.CULL_FACE);
// gl.cullFace(gl.BACK);

const townLocations = [[-gameWidth + 4, 1, 0], [0, 1, 0], [gameWidth - 4, 1, 0]];

const moon = new Moon(game, [0, 0, 0]);
const dome1 = new Dome(game, [townLocations[0][0], townLocations[0][1], townLocations[0][2] - 2], PURPLE);
const dome2 = new Dome(game, [townLocations[1][0], townLocations[1][1], townLocations[1][2] - 2], GREEN);
const dome3 = new Dome(game, [townLocations[2][0], townLocations[2][1], townLocations[2][2] - 2], BLUE);
game.scenary.push(moon);
game.drawables.push(dome1);
game.drawables.push(dome2);
game.drawables.push(dome3);

const cube = new Cube(game, [0,0,-50]);
game.scenary.push(cube);

configurePrograms(gl);

requestAnimationFrame(update);

function shakeScreen(amount) {
  const { shakeInfo } = game;
  const { amplitude, dir } = shakeInfo;
  const MAX_AMP = 6.0;
  vec3.add(amplitude, amplitude, [amount, amount, amount]);
  vec3.set(amplitude, Math.min(MAX_AMP, amplitude[0]), Math.min(MAX_AMP, amplitude[1]), Math.min(MAX_AMP, amplitude[2]));
  vec3.set(dir, oneOrMinusOne(), oneOrMinusOne(), oneOrMinusOne());
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
  resize();
  updateShake(time);
  const { shakeInfo } = game;
  vec3.add(cameraPos, game.camera.staticPos, shakeInfo.pos);
  updateViewProjection();

  if (time - game.timeLastBadMissileFiredAt > game.minTimeBetweenBadMissiles) {
    if (Math.random() < game.chanceOfBadMisslesFiring) {
      const halfWidth = game.bounds.width / 2;
      const launchX = randomFloatBetween(-halfWidth, halfWidth);
      const townToAimAt = vec3.create();
      vec3.copy(townToAimAt, townLocations[randomIntBetween(0, townLocations.length - 1)]);
      const jitter = randomFloatBetween(-0.1, 0.1);
      townToAimAt[0] += jitter;

      game.drawables.push(
        new Missile(game,
          time,
          [launchX, -game.bounds.height, 0.0],
          townToAimAt,
          false,
          BAD_MISSILE_SPEED * game.missileSpeedMultiplier
        )
      );
      game.timeLastBadMissileFiredAt = time;
    }
  }

  game.clickCoords.forEach((coords) => game.drawables.push(
    new Missile(game, time, [0, 3.5, 0], coords, true, GOOD_MISSILE_SPEED * game.missileSpeedMultiplier)
    ));
  game.clickCoords = [];
  game.drawables = game.drawables.filter((drawable) => !drawable.dead);
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
  game.scenary.forEach((drawable) => drawable.update(time));
  draw(time);
  checkCollisions(time);
  requestAnimationFrame(update);
}

function draw(time) {
  // drawOrigin();
  game.scenary.forEach((drawable) => drawable.draw(time));
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
  let touch = event;
  if (event.touches) touch = event.changedTouches[0];
  const worldCoords = unprojectPoint([touch.clientX, touch.clientY]);
  game.clickCoords.push([worldCoords[0], worldCoords[1], 0]);
}

  function unprojectPoint(point) {
  const screenX = point[0];
  const screenY = point[1];
  const x = (screenX / canvas.clientWidth) * 2 - 1;
  const y = -(screenY / canvas.clientHeight) * 2 + 1;

  const coords = [x, y, 0];
  const worldCoords = vec3.create();

  vec3.transformMat4(worldCoords, coords, inverseViewProjectionMatrix);
  vec3.subtract(worldCoords, worldCoords, cameraPos);
  vec3.normalize(worldCoords, worldCoords);
  const distance = -cameraPos[2] / worldCoords[2];
  vec3.scale(worldCoords, worldCoords, distance);
  vec3.add(worldCoords, worldCoords, cameraPos);
  // console.log("screen: ", point);
  // console.log("clip: ", [x, y]);
  // console.log("world: ", worldCoords);
  return worldCoords;
}

function resetCamera() {
  vec3.set(cameraPos, 0, 0, 1);
  vec3.set(lookAtPos, 0, 0, -1);
  updateViewProjection();
}

function updateViewProjection() {
  mat4.copy(projectionMatrix, newProjectionMatrix());
  mat4.copy(viewMatrix, newViewMatrix());
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (dimensions[0] === width && dimensions[1] === height) return;
  gl.viewport(0, 0, width, height);
  resetCamera();
  dimensions[0] = width;
  dimensions[1] = height;

  // Size the horizontal bounds by adjusting z postion of the camera
  const bounds = unprojectPoint([width, height]);
  const z = Math.min(gameWidth / bounds[0], farPlane);
  vec3.set(cameraPos, 0, 0, z);
  vec3.set(lookAtPos, 0, 0, -1);
  updateViewProjection();

  // Move 0 on the y-axis to the bottom of the screen
  const bottomOfWorld = unprojectPoint([width, height], inverseViewProjectionMatrix);
  game.bounds.width = bottomOfWorld[0] * 2;
  game.bounds.height = bottomOfWorld[1] * 2;
  vec3.set(cameraPos, 0, -bottomOfWorld[1], z);
  vec3.copy(game.camera.staticPos, cameraPos);
  vec3.set(lookAtPos, 0, -bottomOfWorld[1], -1);
  updateViewProjection();

  // Place moon
  const radius = gameWidth * .1;
  moon.radius = radius;
  const topRightOfWorld = unprojectPoint([width * .9, height * .1]);
  vec3.set(moon.position, topRightOfWorld[0], topRightOfWorld[1], 0);;

  mat4.copy(projectionMatrix, newProjectionMatrix());
  mat4.copy(viewMatrix, newViewMatrix());
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

  // Make bad missiles faster the game screen is taller
  game.missileSpeedMultiplier = Math.abs(game.bounds.height / 25);
}

function newViewMatrix() {
  let matrix = mat4.create();
  mat4.lookAt(matrix, cameraPos, lookAtPos, [0.0, 1.0, 0.0]);
  return matrix;
}

function newProjectionMatrix() {
  let matrix = mat4.create();
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  mat4.perspective(matrix, fov, aspectRatio, nearPlane, farPlane);
  return matrix;
}

function configurePrograms(gl) {
  Dome.configureProgram(gl);
  Explosion.configureProgram(gl);
  Moon.configureProgram(gl);
  Missile.configureProgram(gl);
  Cube.configureProgram(gl);
}