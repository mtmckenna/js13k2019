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
  "normalMatrix",
  "uColor",
  "uLightPosition",
  "uKd",
  "uLd",
  "uHit",
];

const HIT_TIME = 200;

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
  }

  get collisionPosition() { return this.position; }

  constructor(game, position, color) {
    this.type = "dome";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.dead = false;
    this.color = color;
    this.collidable = true;
    this.modelMatrix = mat4.create();
    this.normalMatrix = mat4.create();
    this.tempMatrix = mat4.create();
    this.radius = 4.2;
    this.rotation = 0;
    this.hitFloat = 0.0;
    this.times = { hitTime: 0 };

    this.initVertexBuffers();
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
    mat4.rotate(tempMatrix, tempMatrix, -Math.PI / 2, [1, 0, 0]);
    mat4.scale(tempMatrix, tempMatrix, [scale, scale, scale]);
    mat4.copy(modelMatrix, tempMatrix);
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    if (time - this.times.hitTime > HIT_TIME) {
      this.hitFloat = 0.0;
    }
  }

  draw(time) {
    const { gl, modelMatrix, normalMatrix } = this;
    const { normalData, indexData, vertexPositionData } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    configureBuffer(gl, program, normalBuffer, normalData, 3, "aNormal");
    setPosition(gl, program, positionBuffer, vertexPositionData);
    setUvs(gl, program, uvBuffer, this.textureCoordData);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform1f(program.uniformsCache["uHit"], this.hitFloat);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    gl.uniform4fv(program.uniformsCache["uLightPosition"], [0, 50, 0, 1.0]);

    gl.uniform3fv(program.uniformsCache["uKd"], this.color);
    gl.uniform3fv(program.uniformsCache["uLd"], [1.0, 1.0, 1.0]);

    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
  }

  hit(time) {
    this.times.hitTime = time;
    this.hitFloat = 1.0;
  }

  // https://bl.ocks.org/camargo/649e5903c4584a21a568972d4a2c16d3
  initVertexBuffers() {
    const vertexPositionData = [];
    const normalData = [];
    const textureCoordData = [];
    const indexData = [];

    const radius = 0.5;
    const latitudeBands = 15;
    const longitudeBands = 15;

    // Calculate sphere vertex positions, normals, and texture coordinates.
    for (let latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
      let theta = latNumber * Math.PI / latitudeBands;
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
        let phi = longNumber * 2 * Math.PI / longitudeBands / 2;
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

    this.vertexPositionData = new Float32Array(vertexPositionData);
    this.normalData = new Float32Array(normalData);
    this.textureCoordData = new Float32Array(textureCoordData);
    this.indexData = new Uint16Array(indexData);
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