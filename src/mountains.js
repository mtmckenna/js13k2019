import { mat4, vec3 } from "./lib/gl-matrix";
import {
  configureBuffer,
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
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
let uvBuffer = null;
let indexBuffer = null;
let vertexData = [];
let uvData = [];
let indexData = [];
let normalData = [];

const MIN_WIDTH = 2.2;
const MAX_WIDTH = 4.8;

export default class Mountains {
  static configureProgram(gl) {
    program = configureProgram(gl);
    normalBuffer = gl.createBuffer();
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
  }

  constructor(game, position, avgDimensions) {
    this.type = "mountains";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.avgDimensions = avgDimensions;
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
    mat4.scale(modelMatrix, modelMatrix, this.avgDimensions);
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  }

  draw(time) {
    const { gl, modelMatrix, normalMatrix } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, vertexData);
    configureBuffer(gl, program, normalBuffer, normalData, 3, "aNormal");
    // setUvs(gl, program, uvBuffer, uvData);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform3f(program.uniformsCache["uLightPosition"], .3, 0, -0.9);
    gl.uniform3f(program.uniformsCache["uLightColor"], 0.0, 0.5, 1.0);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
  }

  configureVertices() {
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
    const numMountains = 7;
    const start = 0;
    let distance = 0;
    vertexData = [];
    indexData = [];
    normalData = [];
    uvData = [];

    vec3.set(vertA, start,  0.0, 0.0);
    vec3.set(vertB, start,  0.0, 5.0);
    vec3.set(vertC, start,  1.0, 0.0);
    vec3.set(vertD, -vertA[0],  vertA[1], vertA[2]);

    for (let i = 0; i < numMountains; i++) {
      const width = randomFloatBetween(MIN_WIDTH, MAX_WIDTH);
      vertA[0] = start + distance;
      vertB[0] = start + distance + width;
      vertC[0] = start + distance + width;
      vertD[0] = vertA[0] + width * 2;
      vertC[1] = randomFloatBetween(0.8, 1.2);
      vertices.forEach((vertex) => vertexData.push(...vertex));

      vec3.subtract(vecA, vertC, vertA);
      vec3.subtract(vecB, vertB, vertA);
      vec3.cross(normalA, vecA, vecB);

      vec3.subtract(vecA, vertD, vertB);
      vec3.subtract(vecB, vertB, vertC);
      vec3.cross(normalB, vecA, vecB);

      normals.forEach((normal) => normalData.push(...normal));

      distance += width * 1.3;
    }


    // console.log("vertex: ", vertexData);
    // console.log("normal: ", normalData);
    // console.log("index:" , indexData);

    // vertexData = [
    //   -0.5,  0.0, 0.0,
    //    0.0,  0.0, 0.0,
    //    0.0,  1.0, 0.0,

    //    0.5,  0.0, 0.0,
    // ];

    // normalData = [
    //   -0.5, -0.5, 0.0,
    //    0.5, -0.5, 0.0,
    //    0.0,  0.5, 0.0,

    //   -0.5, -0.5, 0.0,
    //    0.5, -0.5, 0.0,
    //    0.0,  0.5, 0.0,
    // ];

    // indexData = [
    //   0, 1, 2,
    //   1, 3, 2
    // ];

    // indexData = [
    //   0, 1, 2,
    //   1, 3, 2
    //   4, 5, 6
    //   5, 7, 6
    // ];

    uvData = [
      0.0,  0.0,
      1.0,  0.0,
      0.5,  1.0,
      0.0,  0.0,

      1.0,  0.0,
      0.5,  1.0,
    ]

    vertexData = new Float32Array(vertexData);
    indexData = new Uint16Array(indexData);
    uvData = new Float32Array(uvData);
    normalData = new Float32Array(normalData);
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