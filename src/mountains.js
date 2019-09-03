import { mat4, vec3 } from "./lib/gl-matrix";
import {
  configureBuffer,
  programFromCompiledShadersAndUniformNames,
  setPosition,
  randomFloatBetween,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/mountains-vertex.glsl";
import FRAGMENT_SHADER from "./shaders/mountains-fragment.glsl";
import { UNIFORM_NAMES } from "./models";

const DOME_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "normalMatrix",
  "uLightPosition",
  "uLightColor",
];

let program = null;
let normalBuffer = null;
let positionBuffer = null;

const MIN_WIDTH = 3.2;
const MAX_WIDTH = 5.8;
const DEPTH = 1;

export default class Mountains {
  static configureProgram(gl) {
    program = configureProgram(gl);
    normalBuffer = gl.createBuffer();
    positionBuffer = gl.createBuffer();
  }

  constructor(game, position, dimensions, color) {
    this.type = "mountains";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.color = color;
    this.dimensions = dimensions;
    this.modelMatrix = mat4.create();
    this.normalMatrix = mat4.create();

    this.configureVertices();
    this.update();
  }

  update(time) {
    const { modelMatrix, normalMatrix } = this;
    const { viewMatrix } = this.game;
    const modelViewMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.identity(normalMatrix);

    mat4.translate(modelMatrix, modelMatrix, this.position);
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  }

  draw(time) {
    const { gl, modelMatrix, normalMatrix, color, vertexData, normalData } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, vertexData);
    configureBuffer(gl, program, normalBuffer, normalData, 3, "aNormal");

    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform3f(program.uniformsCache["uLightPosition"], .3, 0, -0.9);
    gl.uniform3f(program.uniformsCache["uLightColor"], ...color);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
  }

  configureVertices() {
    this.vertexData = [];
    this.indexData = [];
    this.normalData = [];

    const vertA = vec3.create();
    const vertB = vec3.create();
    const vertC = vec3.create();
    const vertD = vec3.create();
    const vertices = [vertA, vertB, vertC, vertC, vertB, vertD];
    const vecA = vec3.create();
    const vecB = vec3.create();
    const normalA = vec3.create();
    const normalB = vec3.create();
    const normals = [normalA, normalA, normalA, normalB, normalB, normalB];
    const start = 0;
    let distance = 0;

    vec3.set(vertA, start,  0.0, 0.0);
    vec3.set(vertB, start,  0.0, DEPTH);
    vec3.set(vertC, start,  1.0, 0.0);
    vec3.set(vertD, -vertA[0],  vertA[1], vertA[2]);

    while (distance < this.dimensions[0]) {
      const width = randomFloatBetween(MIN_WIDTH, MAX_WIDTH);
      const maxHeight = this.dimensions[1];
      const height = randomFloatBetween(maxHeight * .6, maxHeight);
      vertA[0] = start + distance;
      vertB[0] = start + distance + width;
      vertC[0] = start + distance + width;
      vertD[0] = vertA[0] + width * 2;
      vertC[1] = height;
      vertA[2] = 0;
      vertB[2] = DEPTH;
      vertC[2] = 0;
      vertD[2] = 0;
      vertices.forEach((vertex) => this.vertexData.push(...vertex));

      vec3.subtract(vecA, vertC, vertA);
      vec3.subtract(vecB, vertB, vertA);
      vec3.cross(normalA, vecA, vecB);

      vec3.subtract(vecA, vertD, vertB);
      vec3.subtract(vecB, vertB, vertC);
      vec3.cross(normalB, vecA, vecB);

      normals.forEach((normal) => this.normalData.push(...normal));

      distance += width * randomFloatBetween(0.7, 1.8);
    }

    this.vertexData = new Float32Array(this.vertexData);
    this.normalData = new Float32Array(this.normalData);
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