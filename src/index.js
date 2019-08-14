//https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3
//http://cgp.wikidot.com/circle-to-circle-collision-detection

import { mat4, vec3 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  randomNumBetween,
} from "./webgl-helpers";
import { UNIFORM_NAMES } from "./models";
import Missile from "./missile";

import "./index.css";

const game = {};
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl", { premultipliedAlpha: false });

import VERTEX_SHADER from "./shaders/vertex.glsl";
import DOT_FRAGMENT_SHADER from "./shaders/dot-fragment.glsl";
import { PLANE } from "./models";

document.body.addEventListener("pointerup", fireMissile, false);
document.body.addEventListener("touchend", fireMissile, false);

const DOT_UNIFORM_NAMES = [...UNIFORM_NAMES, "uColor"];

const gameWidth = 3;
const cameraPos = [0.0, 0.0, 1.0];
const lookAtPos = [0.0, 0.0, -1.0];
const dimensions = [-1, -1];
const nearPlane = 0.5;
const farPlane = 100.0;
const fov = 30;
const viewMatrix = newViewMatrix();
const projectionMatrix = newProjectionMatrix();
const viewProjectionMatrix = mat4.create();
const inverseViewProjectionMatrix = mat4.create();

game.gl = gl;
game.viewMatrix = viewMatrix;
game.projectionMatrix = projectionMatrix;
game.viewProjectionMatrix = viewProjectionMatrix;
game.inverseViewProjectionMatrix = inverseViewProjectionMatrix;
game.drawables = [];
game.clickCoords = [];
game.badMissleLastFired = 0;
game.minTimeBetweenBadMissles = 1000;

mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

let dotProgram = programFromCompiledShadersAndUniformNames(
  gl,
  VERTEX_SHADER,
  DOT_FRAGMENT_SHADER,
  DOT_UNIFORM_NAMES
);

let dotModelMatrix = mat4.create();
mat4.scale(dotModelMatrix, dotModelMatrix, [0.1,0.1,0.1]);

let dotModelMatrixLeft = mat4.create();
mat4.translate(dotModelMatrixLeft, dotModelMatrixLeft, [gameWidth - .2, 0, 0]);
mat4.scale(dotModelMatrixLeft, dotModelMatrixLeft, [0.1,0.1,0.1]);

let dotModelMatrixRight = mat4.create();
mat4.translate(dotModelMatrixRight, dotModelMatrixRight, [-gameWidth + .2, 0, 0]);
mat4.scale(dotModelMatrixRight, dotModelMatrixRight, [0.1,0.1,0.1]);

let dotPositionBuffer = gl.createBuffer();

function drawOrigin() {
  gl.useProgram(dotProgram);
  setPosition(gl, dotProgram, dotPositionBuffer, PLANE);
  gl.uniform1f(dotProgram.uniformsCache["uTime"], 0);
  gl.uniform3f(dotProgram.uniformsCache["uColor"], 0.4, 0.5, 0.3);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrix);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["viewMatrix"], false, viewMatrix);
  gl.uniformMatrix4fv(dotProgram.uniformsCache["projectionMatrix"], false, projectionMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, PLANE.length / 3);

  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrixLeft);
  gl.drawArrays(gl.TRIANGLES, 0, PLANE.length / 3);

  gl.uniformMatrix4fv(dotProgram.uniformsCache["modelMatrix"], false, dotModelMatrixRight);
  gl.drawArrays(gl.TRIANGLES, 0, PLANE.length / 3);
}

requestAnimationFrame(update);

function update(time) {
  resize();
  game.clickCoords.forEach((coords) => game.drawables.push(new Missile(game, time, coords)));
  game.clickCoords = [];
  game.drawables = game.drawables.filter((drawable) => !drawable.dead);
  game.drawables.forEach((drawable) => drawable.update(time));
  draw(time);
  requestAnimationFrame(update);
}

function draw(time) {
  game.drawables.forEach((drawable) => drawable.draw(time));
  drawOrigin();
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
  const y = (screenY / canvas.clientHeight) * 2 - 1;

  const coords = [-x, -y, -1];
  const worldCoords = vec3.create();

  vec3.transformMat4(worldCoords, coords, inverseVPMatrix);
  vec3.subtract(worldCoords, worldCoords, cameraPos);
  vec3.normalize(worldCoords, worldCoords);
  const distance = -cameraPos[2] / worldCoords[2];
  vec3.scale(worldCoords, worldCoords, distance);
  vec3.add(worldCoords, worldCoords, cameraPos);
  return worldCoords;
}

function resetCamera() {
  vec3.set(cameraPos, 0, 0, 1);
  vec3.set(lookAtPos, 0, 0, -1);
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

  // Size the horizontal bounds by adjusting z postion of the camera
  const bounds = unprojectPoint([width, height], inverseViewProjectionMatrix);
  const z = Math.max(gameWidth / bounds[0], nearPlane);
  vec3.set(cameraPos, 0, 0, z);
  vec3.set(lookAtPos, 0, 0, -1);
  mat4.copy(projectionMatrix, newProjectionMatrix());
  mat4.copy(viewMatrix, newViewMatrix());
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

  // Move 0 on the y-axis to the bottom of the screen
  const bottomOfWorld = unprojectPoint([width / 2, height], inverseViewProjectionMatrix);
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