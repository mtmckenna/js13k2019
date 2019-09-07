import { mat4 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
  setNormal,
  randomFloatBetween,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/cube-vertex.glsl";
import FRAGMENT_SHADER from "./shaders/cube-fragment.glsl";
import BUILDING_FRAGMENT_SHADER from "./shaders/cube-building-fragment.glsl";
import BUILDING_VERTEX_SHADER from "./shaders/cube-building-vertex.glsl";
import { CUBE, CUBE_INDICES, CUBE_NORMALS, CUBE_UVS, UNIFORM_NAMES } from "./models";

const CUBE_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "normalMatrix",
  "uColor",
  "uLightPosition",
  "uLightColor",
  "uDimensions",
  "uDead",
];

let programGround = null;
let programBuilding = null;
let normalBuffer = null;
let positionBuffer = null;
let indexBuffer = null;
let uvBuffer = null;

export default class Cube {
  static configureProgram(gl) {
    programGround = configureProgramGround(gl);
    programBuilding = configureProgramBuilding(gl);
    normalBuffer = gl.createBuffer();
    positionBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  constructor(game, position, dimensions, building = false) {
    this.type = "cube";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.dimensions = dimensions;
    this.dead = false;
    this.modelMatrix = mat4.create();
    this.normalMatrix = mat4.create();
    this.rotation = building ? randomFloatBetween(-Math.PI, Math.PI) : 0;
    this.building = building;
    this.program = building ? programBuilding : programGround;
    this.color = building ? [.7, .7, .7] : [0.47, 0.74, 0.54];

    this.update();
  }

  update(time) {
    const { modelMatrix, normalMatrix } = this;
    const { viewMatrix } = this.game;
    const modelViewMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.identity(normalMatrix);
    mat4.translate(modelMatrix, modelMatrix, this.position);
    mat4.rotate(modelMatrix, modelMatrix, this.rotation,  [0, 1, 0]);
    mat4.scale(modelMatrix, modelMatrix, this.dimensions);
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  }

  draw(time) {
    const { gl, modelMatrix, normalMatrix, program } = this;
    const { viewMatrix, projectionMatrix } = this.game;
    gl.useProgram(program);

    setNormal(gl, program, normalBuffer, CUBE_NORMALS);
    setPosition(gl, program, positionBuffer, CUBE);
    setUvs(gl, program, uvBuffer, CUBE_UVS);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

    gl.uniform1f(program.uniformsCache["uDead"], this.dead ? 1.0 : 0.0);
    gl.uniform3f(program.uniformsCache["uDimensions"], ...this.dimensions);
    gl.uniform3f(program.uniformsCache["uLightPosition"], .25, 1, 0);
    gl.uniform3f(program.uniformsCache["uLightColor"], 1.0, 1.0, 1.0);
    gl.uniform3f(program.uniformsCache["uColor"], ...this.color);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["normalMatrix"], false, normalMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.CULL_FACE);
  }
}

function configureProgramGround(gl) {
  return programFromCompiledShadersAndUniformNames(
    gl,
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    CUBE_UNIFORM_NAMES
  );
}

function configureProgramBuilding(gl) {
  return programFromCompiledShadersAndUniformNames(
    gl,
    BUILDING_VERTEX_SHADER,
    BUILDING_FRAGMENT_SHADER,
    CUBE_UNIFORM_NAMES
  );
}