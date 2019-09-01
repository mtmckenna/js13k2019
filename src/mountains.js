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
    gl.uniform3f(program.uniformsCache["uLightPosition"], 0, 1, 0);
    gl.uniform3f(program.uniformsCache["uLightColor"], 1.0, 1.0, 1.0);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);

    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
  }

  configureVertices() {
    const vertA = vec3.create();
    const vertB = vec3.create();
    const vertC = vec3.create();
    const vertD = vec3.create();
    const vertices = [vertA, vertB, vertC, vertD];
    const vecA = vec3.create();
    const vecB = vec3.create();
    const normal = vec3.create();
    const numMountains = 10;
    let distance = 0;
    const start = -10;

    vec3.set(vertA, start,  0.0, 0.0);
    vec3.set(vertB, start,  0.0, 0.0);
    vec3.set(vertC, start,  1.0, 0.0);
    vec3.set(vertD, -vertA[0],  vertA[1], vertA[2]);

    for (let i = 0; i < numMountains; i++) {
      vertA[0] = start + distance;
      vertB[0] = start + distance + 1;
      vertC[0] = start + distance + 1;
      vertD[0] = vertA[0] + 2;
      vertC[1] = randomFloatBetween(0.8, 1.2);
      console.log(vertC[1])
      vertices.forEach((vertex) => vertexData.push(...vertex));
      distance += 2;
    }

    for (let i = 0; i < numMountains; i++) {
      const index = i * 3 + i;
      indexData.push(index + 0, index + 1, index + 2);
      indexData.push(index + 1, index + 3, index + 2);
    }

    for (let i = 0; i < indexData.length / 3; i++) {
      const tri = [
        [vertexData[i + 0], vertexData[i + 1], vertexData[i + 2]],
        [vertexData[i + 3], vertexData[i + 4], vertexData[i + 5]],
        [vertexData[i + 6], vertexData[i + 7], vertexData[i + 8]],
      ];

      for (let i = 0; i < 3; i++) {
        const a = (i + 1) % 3;
        const b = (i + 2) % 3;
        vec3.subtract(vecA, tri[i], tri[a]);
        vec3.subtract(vecB, tri[i], tri[b]);
        vec3.cross(normal, vecA, vecB);
        normalData.push(...normal);
      }
    }

    // console.log(vertexData);
    // console.log(normalData);
    // console.log(indexData);

    // vec3.subtract(vecA, vertC, vertA);
    // vec3.subtract(vecB, vertB, vertA);
    // vec3.subtract(vecC, vertC, vertB);
    // vec3.subtract(vecD, vertB, vertD);
    // vec3.cross(normal1, vecA, vecB);
    // vec3.cross(normal2, vecC, vecD);

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