import { mat4 } from "./lib/gl-matrix";
import {
  configureBuffer,
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/cube-vertex.glsl";
import FRAGMENT_SHADER from "./shaders/cube-fragment.glsl";
import { CUBE, CUBE_INDICES, CUBE_NORMALS, CUBE_UVS, UNIFORM_NAMES } from "./models";

const DOME_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "normalMatrix",
];

let program = null;
let normalBuffer = null;
let positionBuffer = null;
let indexBuffer = null;
let uvBuffer = null;

export default class Cube {

  static configureProgram(gl) {
    program = configureProgram(gl);
    normalBuffer = gl.createBuffer();
    positionBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  constructor(game, position) {
    this.type = "cube";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    // this.times = { start: startTime, startFade: startFadeTime, end: startFadeTime + FADE_TIME };
    this.dead = false;
    this.collidable = true;
    this.modelMatrix = mat4.create();
    this.normalMatrix = mat4.create();
    this.tempMatrix = mat4.create();
    this.radius = 2.5;
    this.rotation = 0;

    this.update();
  }

  update(time) {
    const { modelMatrix, normalMatrix, tempMatrix } = this;
    const { viewMatrix } = this.game;
    const scale = this.radius * 2;
    const modelViewMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.identity(tempMatrix);
    mat4.identity(normalMatrix);
    mat4.translate(tempMatrix, modelMatrix, this.position);
    // mat4.scale(tempMatrix, tempMatrix, [scale, scale, scale]);
    mat4.scale(tempMatrix, tempMatrix, [100.0, .5, 50.0]);
    mat4.copy(modelMatrix, tempMatrix);
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  }

  draw(time) {
    const { gl, modelMatrix, normalMatrix } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    // configureBuffer(gl, program, normalBuffer, CUBE_NORMALS, 3, "aNormal");
    setPosition(gl, program, positionBuffer, CUBE);
    // setUvs(gl, program, uvBuffer, CUBE_UVS);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

    // gl.uniform3f(program.uniformsCache["uColor"], 1.0, 0.0, 0.0);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    // gl.uniform4fv(program.uniformsCache["uLightPosition"], [-0, 100, 0, 1.0]);
    // gl.uniform4fv(program.uniformsCache["uLightPosition"], [this.position[0], this.position[1], this.position[2], 1.0]);

    // gl.uniform3fv(program.uniformsCache["uKd"], [1.0, 0.84, 0.0]);
    // gl.uniform3fv(program.uniformsCache["uLd"], [1.0, 1.0, 1.0]);

    gl.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);
  }

}

function configureProgram(gl) {
  return programFromCompiledShadersAndUniformNames(
    gl,
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    DOME_UNIFORM_NAMES
  );
}