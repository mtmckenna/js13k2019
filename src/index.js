//https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3

import { mat4, vec3 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  randomFloatBetween,
  randomIntBetween,
} from "./webgl-helpers";
import { UNIFORM_NAMES } from "./models";
import Missile from "./missile";
import Explosion from "./explosion";

import "./index.css";

const game = {};
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl", { premultipliedAlpha: false });

// https://www.khronos.org/webgl/wiki/HandlingContextLost
canvas.addEventListener("webglcontextlost", (event) => event.preventDefault(), false);
canvas.addEventListener("webglcontextrestored", () => configurePrograms(gl), false);

import VERTEX_SHADER from "./shaders/vertex.glsl";
import DOT_FRAGMENT_SHADER from "./shaders/dot-fragment.glsl";
import { QUAD, TRAIL } from "./models";

document.body.addEventListener("pointerup", fireMissile, false);
document.body.addEventListener("touchend", fireMissile, false);

const DOT_UNIFORM_NAMES = [...UNIFORM_NAMES, "uColor"];

const gameWidth = 2;
const cameraPos = [0.0, 0.0, -1.0];
const lookAtPos = [0.0, 0.0, 1.0];
const dimensions = [-1, -1];
const nearPlane = 0.5;
const farPlane = 100.0;
const fov = 30;
const viewMatrix = newViewMatrix();
const projectionMatrix = newProjectionMatrix();
const viewProjectionMatrix = mat4.create();
const inverseViewProjectionMatrix = mat4.create();
const GOOD_MISSILE_SPEED = 0.0019;
const BAD_MISSILE_SPEED = 0.00025;

game.gl = gl;
game.viewMatrix = viewMatrix;
game.projectionMatrix = projectionMatrix;
game.viewProjectionMatrix = viewProjectionMatrix;
game.inverseViewProjectionMatrix = inverseViewProjectionMatrix;
game.drawables = [];
game.clickCoords = [];
game.timeLastBadMissileFiredAt = 0;
game.minTimeBetweenBadMissiles = 1000;
game.chanceOfBadMisslesFiring = 0.1;
game.bounds = { width: -1, height: -1 };

mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

let dotProgram = programFromCompiledShadersAndUniformNames(
  gl,
  VERTEX_SHADER,
  DOT_FRAGMENT_SHADER,
  DOT_UNIFORM_NAMES
);

const townLocations = [[-gameWidth + .2, 0, 0], [0, 0, 0], [gameWidth - .2, -0.1, 0]];

let dotModelMatrixLeft = mat4.create();
mat4.translate(dotModelMatrixLeft, dotModelMatrixLeft, townLocations[0]);
mat4.scale(dotModelMatrixLeft, dotModelMatrixLeft, [0.1, 0.1, 0.1]);

let dotModelMatrix = mat4.create();
mat4.translate(dotModelMatrix, dotModelMatrix, townLocations[1]);
mat4.scale(dotModelMatrix, dotModelMatrix, [0.1, 0.1, 0.1]);

let dotModelMatrixRight = mat4.create();
mat4.translate(dotModelMatrixRight, dotModelMatrixRight, townLocations[2]);
mat4.scale(dotModelMatrixRight, dotModelMatrixRight, [0.1, 0.1, 0.1]);

let dotPositionBuffer = gl.createBuffer();

configurePrograms(gl);

function drawOrigin() {
  gl.useProgram(dotProgram);
  setPosition(gl, dotProgram, dotPositionBuffer, TRAIL);
  gl.uniform1f(dotProgram.uniformsCache["uTime"], 0);
  gl.uniform3f(dotProgram.uniformsCache["uColor"], 0.2, 0.9, 0.2);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrix);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["viewMatrix"], false, viewMatrix);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["projectionMatrix"], false, projectionMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);

  gl.uniform3f(dotProgram.uniformsCache["uColor"], 0.9, 0.2, 0.2);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrixLeft);
  gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);

  gl.uniform3f(dotProgram.uniformsCache["uColor"], 0.2, 0.2, 0.9);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrixRight);
  gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);
}

requestAnimationFrame(update);

function update(time) {
  resize();

  if (time - game.timeLastBadMissileFiredAt > game.minTimeBetweenBadMissiles) {
    if (Math.random() < game.chanceOfBadMisslesFiring) {
      const halfWidth = game.bounds.width / 2;
      const townToAimAt = vec3.create();
      vec3.copy(townToAimAt, townLocations[randomIntBetween(0, townLocations.length - 1)]);
      const jitter = randomFloatBetween(-0.1, 0.1);
      townToAimAt[0] += jitter;

      game.drawables.push(
        new Missile(game,
          time,
          [randomFloatBetween(-halfWidth, halfWidth), -game.bounds.height, 0.0],
          // [randomFloatBetween(-halfWidth, halfWidth), 0, 0.0],
          townToAimAt,
          false,
          BAD_MISSILE_SPEED
        )
      );
      game.timeLastBadMissileFiredAt = time;
    }
  }

  game.clickCoords.forEach((coords) => game.drawables.push(
    new Missile(game, time, [0, 0, 0], coords, true, GOOD_MISSILE_SPEED)
    ));
  game.clickCoords = [];
  game.drawables = game.drawables.filter((drawable) => !drawable.dead);
  game.drawables.forEach((drawable) => drawable.update(time));
  draw(time);
  checkCollisions(time);
  requestAnimationFrame(update);
}

function draw(time) {
  drawOrigin();
  game.drawables.forEach((drawable) => drawable.draw(time));

}

// TODO: Consider space partioning to make this faster
function checkCollisions(time) {
  game.drawables.forEach((drawable) => {
    if (drawable.type !== "explosion" || drawable.good === false) return;
    game.drawables.forEach((otherDrawable) => {
      if (drawable === otherDrawable) return;
      if (drawable.collidable === false) return;
      if (otherDrawable.type !== "missile") return;
      if (otherDrawable.good === true) return;
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
  const worldCoords = unprojectPoint([touch.clientX, touch.clientY], inverseViewProjectionMatrix);
  game.clickCoords.push([worldCoords[0], worldCoords[1], 0]);
}

function unprojectPoint(point, inverseVPMatrix) {
  const screenX = point[0];
  const screenY = point[1];
  const x = (screenX / canvas.clientWidth) * 2 - 1;
  const y = -(screenY / canvas.clientHeight) * 2 + 1;

  const coords = [x, y, 1];
  const worldCoords = vec3.create();

  vec3.transformMat4(worldCoords, coords, inverseVPMatrix);
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
  vec3.set(cameraPos, 0, 0, -1);
  vec3.set(lookAtPos, 0, 0, 1);
  mat4.copy(projectionMatrix, newProjectionMatrix());
  mat4.copy(viewMatrix, newViewMatrix());
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Return if dimensions haven't changed
  if (dimensions[0] === width && dimensions[1] === height) return;
  resetCamera();
  dimensions[0] = width;
  dimensions[1] = height;

  const bounds = unprojectPoint([width, height], inverseViewProjectionMatrix);
  const z = -Math.max(gameWidth / bounds[0], nearPlane);

  // Size the horizontal bounds by adjusting z postion of the camera
  vec3.set(cameraPos, 0, 0, z);
  vec3.set(lookAtPos, 0, 0, 1);
  mat4.copy(projectionMatrix, newProjectionMatrix());
  mat4.copy(viewMatrix, newViewMatrix());

  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

  // Move 0 on the y-axis to the bottom of the screen
  const bottomOfWorld = unprojectPoint([width, height], inverseViewProjectionMatrix);
  game.bounds.width = bottomOfWorld[0] * 2;
  game.bounds.height = bottomOfWorld[1] * 2;
  bottomOfWorld[1] = -bottomOfWorld[1] + .2;
  vec3.set(cameraPos, 0, bottomOfWorld[1], z);
  vec3.set(lookAtPos, 0, bottomOfWorld[1], -1);
  mat4.copy(projectionMatrix, newProjectionMatrix());
  mat4.copy(viewMatrix, newViewMatrix());
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);
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
  Missile.configureProgram(gl);
  Explosion.configureProgram(gl);
}