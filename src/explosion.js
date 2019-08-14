import { mat4 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  randomNumBetween,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import DOT_FRAGMENT_SHADER from "./shaders/explosion-fragment.glsl";
import { PLANE, PLANE_UVS, UNIFORM_NAMES } from "./models";

const EXPLOSION_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uEndTime",
  "uStartTime",
  "uRandom",
  "uGood",
];

let program = null;
let positionBuffer = null;
let uvBuffer = null;

export default class Explosion {

  static configureProgram(gl) {
    program = configureProgram(gl);
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  constructor(game, startTime, position, good = true) {
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.times = { start: startTime, end: startTime + 1500 };
    this.dead = false;
    this.good = good ? 1.0 : 0.0;
    this.modelMatrix = mat4.create();
    this.startingSize = 0.05;
    this.currentSize = this.startingSize;
    this.randomFloat = randomNumBetween(0, 1);

    this.update(startTime);
  }

  update(time) {
    if (time > this.times.end) this.dead = true;

    const { modelMatrix } = this;
    this.currentSize += .005;

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [-this.position[0], this.position[1], 0]);
    mat4.scale(modelMatrix, modelMatrix, [this.currentSize, this.currentSize, this.currentSize]);
  }

  draw(time) {
    const { gl, modelMatrix, randomFloat } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, PLANE);
    setUvs(gl, program, uvBuffer, PLANE_UVS);
    gl.uniform1f(program.uniformsCache["uGood"], this.good);
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform3f(program.uniformsCache["uColor"], 1.0, 0.5, 0.0);
    gl.uniform1f(program.uniformsCache["uRandom"], randomFloat);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, PLANE.length / 3);
  }
}

function configureProgram(gl) {
  return programFromCompiledShadersAndUniformNames(
    gl,
    VERTEX_SHADER,
    DOT_FRAGMENT_SHADER,
    EXPLOSION_UNIFORM_NAMES
  );
}