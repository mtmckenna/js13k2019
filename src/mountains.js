import { mat4, vec3 } from "./lib/gl-matrix";
import {
  configureBuffer,
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/mountains-vertex.glsl";
import FRAGMENT_SHADER from "./shaders/mountains-fragment.glsl";
import { UNIFORM_NAMES } from "./models";

const DOME_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "normalMatrix",
];

const HIT_TIME = 200;

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
    setUvs(gl, program, uvBuffer, uvData);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);

    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
  }

  configureVertices() {
    vertexData = [
      -0.5,  0.0, 0.0,
       0.0,  0.0, 1.0,
       0.0,  1.0, 0.0,

       0.5,  0.0, 0.0,
    ];

    normalData = [
      -0.5, -0.5, 0.0,
       0.5, -0.5, 0.0,
       0.0,  0.5, 0.0,

      -0.5, -0.5, 0.0,
       0.5, -0.5, 0.0,
       0.0,  0.5, 0.0,
    ];

    indexData = [
      0, 1, 2,
      1, 3, 2
    ];

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