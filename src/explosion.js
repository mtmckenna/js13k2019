import { mat4 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import DOT_FRAGMENT_SHADER from "./shaders/explosion-fragment.glsl";
import { PLANE, UNIFORM_NAMES } from "./models";

const EXPLOSION_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uEndTime",
  "uStartTime",
];

let program = null;
let positionBuffer = null;

export default class Explosion {
  constructor(game, startTime, position) {
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.times = { start: startTime, end: startTime + 1500 };
    this.dead = false;
    this.modelMatrix = mat4.create();
    this.startingSize = 0.05;
    this.currentSize = this.startingSize;
    if (!program) program = configureProgram(this.gl);
    positionBuffer = this.gl.createBuffer();
    this.update(startTime);
  }


  update(time) {
    if (time > this.times.end) {
      this.dead = true;
      return;
    }

    const { modelMatrix } = this;
    this.currentSize += .005;

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [-this.position[0], this.position[1], 0]);
    mat4.scale(modelMatrix, modelMatrix, [this.currentSize, this.currentSize, this.currentSize]);
  }

  draw() {
    const { gl, modelMatrix } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, PLANE);
    gl.uniform1f(program.uniformsCache["uTime"], 0);
    gl.uniform3f(program.uniformsCache["uColor"], 1.0, 0.5, 0.0);
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