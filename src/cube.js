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
  "uColor",
  "uFadeDistance",
  "uLightDirection",
  "uLightPosition",
  "uLightColor",
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

  constructor(game, position, dimensions) {
    this.type = "cube";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.dimensions = dimensions;
    this.modelMatrix = mat4.create();
    this.normalMatrix = mat4.create();
    this.tempMatrix = mat4.create();
    this.rotation = 0;
    this.fadeDistance = 1.0;

    this.update();
  }

  update(time) {
    this.rotation += 0.01;
    const { modelMatrix, normalMatrix, tempMatrix } = this;
    const { viewMatrix } = this.game;
    const modelViewMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.identity(tempMatrix);
    mat4.identity(normalMatrix);
    mat4.translate(tempMatrix, modelMatrix, this.position);
    mat4.scale(tempMatrix, tempMatrix, this.dimensions);
    // mat4.rotate(tempMatrix, tempMatrix, -this.rotation, [1,0,0]);
    mat4.copy(modelMatrix, tempMatrix);
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  }

  draw(time) {
    const { gl, modelMatrix, normalMatrix } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    configureBuffer(gl, program, normalBuffer, CUBE_NORMALS, 3, "aNormal");

    setPosition(gl, program, positionBuffer, CUBE);
    setUvs(gl, program, uvBuffer, CUBE_UVS);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

    gl.uniform1f(program.uniformsCache["uFadeDistance"], this.fadeDistance);
    gl.uniform3f(program.uniformsCache["uLightDirection"], 0.0, 1.0, 0.0);
    gl.uniform3f(program.uniformsCache["uLightPosition"], 0.0, 0.0, 0.0);
    gl.uniform3f(program.uniformsCache["uLightColor"], 1.0, 1.0, 1.0);
    gl.uniform3f(program.uniformsCache["uColor"], 0.47, 0.74, 0.54);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);

    gl.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.DEPTH_TEST);
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