import { mat4 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  randomFloatBetween,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import FRAGMENT_SHADER from "./shaders/moon-fragment.glsl";
import { QUAD, QUAD_UVS, UNIFORM_NAMES } from "./models";

const EXPLOSION_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
];

let program = null;
let positionBuffer = null;
let uvBuffer = null;

export default class Moon {
  static configureProgram(gl) {
    program = configureProgram(gl);
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  constructor(game, position) {
    this.type = "moon";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.dead = false;
    this.collidable = false;
    this.modelMatrix = mat4.create();
    this.tempMatrix = mat4.create();
    this.radius = 1.0;
    this.update(0);
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
    setPosition(gl, program, positionBuffer, QUAD);
    setUvs(gl, program, uvBuffer, QUAD_UVS);
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, QUAD.length / 3);
  }
}

function configureProgram(gl) {
  return programFromCompiledShadersAndUniformNames(
    gl,
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    EXPLOSION_UNIFORM_NAMES
  );
}