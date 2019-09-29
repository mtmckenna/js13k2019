import { mat4 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  randomFloatBetween,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import FRAGMENT_SHADER from "./shaders/explosion-fragment.glsl";
// circle in above from https://thebookofshaders.com/07/

import { QUAD, QUAD_UVS, UNIFORM_NAMES } from "./models";

const EXPLOSION_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uEndTime",
  "uStartTime",
  "uStartFadeTime",
  "uRandom",
  "uGood",
];

const FADE_TIME = 500;

let program = null;
let positionBuffer = null;
let uvBuffer = null;

export default class Explosion {

  static configureProgram(gl) {
    program = configureProgram(gl);
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  get collisionPosition() { return this.position; }

  constructor(game, startTime, position, good = true) {
    this.type = "explosion";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    const startFadeTime = startTime + 2000;
    this.times = { start: startTime, startFade: startFadeTime, end: startFadeTime + FADE_TIME };
    this.dead = false;
    this.good = good;
    this.collidable = true;
    this.goodFloat = good ? 1.0 : 0.0;
    this.modelMatrix = mat4.create();
    this.startingSize = 0.5;
    this.currentSize = this.startingSize;
    this.radius = this.currentSize / 2;
    this.randomFloat = randomFloatBetween(0, 1);

    this.update(startTime);
  }

  update(time) {
    if (time > this.times.end) this.dead = true;
    if (time > this.times.startFade) this.collidable = false;

    const { modelMatrix } = this;
    this.currentSize += .05;
    this.radius = this.currentSize / 2;

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [this.position[0], this.position[1], 0]);
    mat4.scale(modelMatrix, modelMatrix, [this.currentSize, this.currentSize, this.currentSize]);
  }

  draw(time) {
    const { gl, modelMatrix, randomFloat } = this;
    const { viewMatrix, projMat } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, QUAD);
    setUvs(gl, program, uvBuffer, QUAD_UVS);
    gl.uniform1f(program.uniformsCache["uGood"], this.goodFloat);
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform1f(program.uniformsCache["uEndTime"], this.times.end);
    gl.uniform1f(program.uniformsCache["uStartFadeTime"], this.times.startFade);
    gl.uniform1f(program.uniformsCache["uRandom"], randomFloat);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projMat"], false, projMat);
    gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);
  }
}

function configureProgram(gl) {
  return programFromCompiledShadersAndUniformNames(
    gl,
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    EXPLOSION_UNIFORM_NAMES
  );
}