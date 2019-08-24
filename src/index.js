//https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3

import TinyMusic from "./lib/tinymusic";
import { mat4, vec3 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  oneOrMinusOne,
  randomFloatBetween,
  randomIntBetween,
} from "./webgl-helpers";
import { UNIFORM_NAMES } from "./models";
import Dome from "./dome";
import Explosion from "./explosion";
import Missile from "./missile";
import Moon from "./moon";

import "./index.css";

const game = {};
const EPSILON = 0.0001;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl", { premultipliedAlpha: true });

// https://www.khronos.org/webgl/wiki/HandlingContextLost
canvas.addEventListener("webglcontextlost", (event) => event.preventDefault(), false);
canvas.addEventListener("webglcontextrestored", () => configurePrograms(gl), false);

import VERTEX_SHADER from "./shaders/vertex.glsl";
import DOT_FRAGMENT_SHADER from "./shaders/dot-fragment.glsl";
import { QUAD, TRAIL } from "./models";

document.body.addEventListener("pointerup", fireMissile, false);
document.body.addEventListener("touchend", fireMissile, false);

const DOT_UNIFORM_NAMES = [...UNIFORM_NAMES, "uColor"];
console.log(TinyMusic);

const gameWidth = 20;
const cameraPos = vec3.create();
const lookAtPos = vec3.create();
const dimensions = [-1, -1];
const nearPlane = 0.1 + EPSILON;
const farPlane = 400.0;
const fov = 30 * Math.PI / 180;
const cameraModelMatrix = mat4.create();
const viewMatrix = newViewMatrix();
const projectionMatrix = newProjectionMatrix();
const viewProjectionMatrix = mat4.create();
const inverseViewProjectionMatrix = mat4.create();
const GOOD_MISSILE_SPEED = 0.019;
const BAD_MISSILE_SPEED = 0.0025;
const GOOD_MISSILE_SHAKE_AMOUNT = 0.09;
const BAD_MISSILE_SHAKE_AMOUNT = 0.3;
const GREEN = [0.2, 0.9, 0.2];
const RED = [0.9, 0.2, 0.2];
const BLUE = [0.2, 0.2, 0.9];
const GOLD = [1.0, 0.84, 0.0];

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

let dotProgram = programFromCompiledShadersAndUniformNames(
  gl,
  VERTEX_SHADER,
  DOT_FRAGMENT_SHADER,
  DOT_UNIFORM_NAMES
);

const townLocations = [[-gameWidth + 4, 0, 0], [0, 0, 0], [gameWidth - 4, 0, 0]];

let dotModelMatrixLeft = mat4.create();
mat4.translate(dotModelMatrixLeft, dotModelMatrixLeft, townLocations[0]);
mat4.scale(dotModelMatrixLeft, dotModelMatrixLeft, [1, 1, 1]);

let dotModelMatrix = mat4.create();
mat4.translate(dotModelMatrix, dotModelMatrix, townLocations[1]);
mat4.scale(dotModelMatrix, dotModelMatrix, [1, 1, 1]);

let dotModelMatrixRight = mat4.create();
mat4.translate(dotModelMatrixRight, dotModelMatrixRight, townLocations[2]);
mat4.scale(dotModelMatrixRight, dotModelMatrixRight, [1, 1, 1]);

let dotPositionBuffer = gl.createBuffer();

const moon = new Moon(game, [0, 0, 0]);
const dome1 = new Dome(game, townLocations[0], GREEN);
const dome2 = new Dome(game, townLocations[1], GOLD);
const dome3 = new Dome(game, townLocations[2], BLUE);
game.scenary.push(moon);
game.scenary.push(dome1);
game.scenary.push(dome2);
game.scenary.push(dome3);

configurePrograms(gl);

function drawOrigin() {
  gl.useProgram(dotProgram);
  setPosition(gl, dotProgram, dotPositionBuffer, TRAIL);
  gl.uniform1f(dotProgram.uniformsCache["uTime"], 0);
  gl.uniform3f(dotProgram.uniformsCache["uColor"], ...GOLD);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrix);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["viewMatrix"], false, viewMatrix);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["projectionMatrix"], false, projectionMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);

  gl.uniform3f(dotProgram.uniformsCache["uColor"], ...GREEN);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrixLeft);
  gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);

  gl.uniform3f(dotProgram.uniformsCache["uColor"], ...BLUE);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrixRight);
  gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);
}

requestAnimationFrame(update);

function shakeScreen(amount) {
  vec3.add(game.shakeInfo.amplitude, game.shakeInfo.amplitude, [amount, amount, amount]);
  vec3.set(game.shakeInfo.dir, oneOrMinusOne(), oneOrMinusOne(), -1);
}

function updateShake(time) {
  const { shakeInfo, camera } = game;
  const { amplitude, dir } = shakeInfo;
  vec3.scale(amplitude, amplitude, 0.9);

  if (Math.abs(amplitude[0]) <= .001) {
    vec3.set(shakeInfo.pos, 0, 0, 0);
  } else {
    const offset = Math.sin(time / 200);
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
  mat4.fromTranslation(cameraModelMatrix, shakeInfo.pos);
  mat4.copy(viewMatrix, newViewMatrix());
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

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
          BAD_MISSILE_SPEED
        )
      );
      game.timeLastBadMissileFiredAt = time;
    }
  }

  game.clickCoords.forEach((coords) => game.drawables.push(
    new Missile(game, time, townLocations[1], coords, true, GOOD_MISSILE_SPEED)
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
  drawOrigin();
  game.scenary.forEach((drawable) => drawable.draw(time));
  game.drawables.forEach((drawable) => drawable.draw(time));
}

// TODO: Consider space partioning to make this faster
function checkCollisions(time) {
  game.drawables.forEach((drawable) => {
    if (drawable.type !== "explosion") return; // Only explosions can blow up other stuff
    game.drawables.forEach((otherDrawable) => {
      if (drawable === otherDrawable) return;
      if (drawable.collidable === false) return;
      if (otherDrawable.type !== "missile") return;
      if (otherDrawable.good === true) return;
      if (otherDrawable.collidable === false) return;
      const distance = vec3.distance(drawable.position, otherDrawable.payloadPosition);
      if (distance < (drawable.radius + otherDrawable.radius)) {
        otherDrawable.explode(time);
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
  // console.log(z)
  vec3.set(cameraPos, 0, 0, z);
  vec3.set(lookAtPos, 0, 0, -1);
  updateViewProjection();

  // Move 0 on the y-axis to the bottom of the screen
  const bottomOfWorld = unprojectPoint([width, height], inverseViewProjectionMatrix);
  game.bounds.width = bottomOfWorld[0] * 2;
  game.bounds.height = bottomOfWorld[1] * 2;
  vec3.set(cameraPos, 0, -bottomOfWorld[1], z);
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
}

function newViewMatrix() {
  let matrix = mat4.create();
  mat4.lookAt(matrix, cameraPos, lookAtPos, [0.0, 1.0, 0.0]);
  mat4.multiply(matrix, matrix, cameraModelMatrix);
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
}