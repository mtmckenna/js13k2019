import { mat4 } from "./lib/gl-matrix";
import {
  configureBuffer,
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/dome-vertex.glsl";
import FRAGMENT_SHADER from "./shaders/dome-fragment.glsl";
import { UNIFORM_NAMES } from "./models";

const DOME_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uColor",
  "uLightPosition",
  "uKd",
  "uLd",
];

let vertexPositionData = [];
let normalData = [];
let textureCoordData = [];
let indexData = [];
let program = null;
let normalBuffer = null;
let positionBuffer = null;
let uvBuffer = null;
let indexBuffer = null;

export default class Dome {

  static configureProgram(gl) {
    program = configureProgram(gl);
    normalBuffer = gl.createBuffer();
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    initVertexBuffers(gl);
  }

  constructor(game, position) {
    this.type = "dome";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    // this.times = { start: startTime, startFade: startFadeTime, end: startFadeTime + FADE_TIME };
    this.dead = false;
    this.collidable = true;
    this.modelMatrix = mat4.create();
    this.tempMatrix = mat4.create();
    this.radius = 0.25;

    this.update();
  }

  update(time) {
    const { modelMatrix, tempMatrix } = this;
    const scale = this.radius * 2;
    mat4.identity(modelMatrix);
    mat4.identity(tempMatrix);
    mat4.translate(tempMatrix, modelMatrix, [this.position[0], this.position[1], 0]);
    mat4.scale(tempMatrix, tempMatrix, [scale, scale, scale]);
    mat4.copy(modelMatrix, tempMatrix);
  }

  draw(time) {
    const { gl, modelMatrix } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    configureBuffer(gl, program, normalBuffer, normalData, 3, "aNormal");
    setPosition(gl, program, positionBuffer, vertexPositionData);
    setUvs(gl, program, uvBuffer, textureCoordData);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.uniform3f(program.uniformsCache["uColor"], 1.0, 0.0, 0.0);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    gl.uniform4fv(program.uniformsCache["uLightPosition"], [0.0, -2.0, -5.0, 1.0]);
    gl.uniform3fv(program.uniformsCache["uKd"], [0.9, 0.5, 0.3]);
    gl.uniform3fv(program.uniformsCache["uLd"], [1.0, 1.0, 1.0]);

    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
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

// https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3
function initVertexBuffers(gl) {
  const latitudeBands = 50;
  const longitudeBands = 50;
  const radius = 1;

  // Calculate sphere vertex positions, normals, and texture coordinates.
  for (let latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
    let theta = latNumber * Math.PI / latitudeBands;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
      let phi = longNumber * 2 * Math.PI / longitudeBands;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);

      let x = cosPhi * sinTheta;
      let y = cosTheta;
      let z = sinPhi * sinTheta;

      let u = 1 - (longNumber / longitudeBands);
      let v = 1 - (latNumber / latitudeBands);

      vertexPositionData.push(radius * x);
      vertexPositionData.push(radius * y);
      vertexPositionData.push(radius * z);

      normalData.push(x);
      normalData.push(y);
      normalData.push(z);

      textureCoordData.push(u);
      textureCoordData.push(v);
    }
  }

  // Calculate sphere indices.
  for (let latNumber = 0; latNumber < latitudeBands; ++latNumber) {
    for (let longNumber = 0; longNumber < longitudeBands; ++longNumber) {
      let first = (latNumber * (longitudeBands + 1)) + longNumber;
      let second = first + longitudeBands + 1;

      indexData.push(first);
      indexData.push(second);
      indexData.push(first + 1);

      indexData.push(second);
      indexData.push(second + 1);
      indexData.push(first + 1);
    }
  }

  vertexPositionData = new Float32Array(vertexPositionData);
  normalData = new Float32Array(normalData);
  textureCoordData = new Float32Array(textureCoordData);
  indexData = new Uint16Array(indexData);
}