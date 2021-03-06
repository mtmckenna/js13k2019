import { mat4 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import FRAGMENT_SHADER from "./shaders/moon-fragment.glsl";
import { QUAD, QUAD_UVS, UNIFORM_NAMES } from "./models";

const EXPLOSION_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uStar",
  "uSeed",
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

  constructor(game, position, star = false) {
    this.type = "moon";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.dead = false;
    this.collidable = false;
    this.starFloat = 0.0;
    this.modelMatrix = mat4.create();
    this.radius = 1.0;
    this.update(0);
  }

  update(time) {
    const { modelMatrix } = this;
    const scale = this.radius * 2;
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, this.position);
    mat4.scale(modelMatrix, modelMatrix, [scale, scale, scale]);
  }

  draw(time) {
    const { gl, modelMatrix } = this;
    const { viewMatrix, projMat } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, QUAD);
    setUvs(gl, program, uvBuffer, QUAD_UVS);
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform1f(program.uniformsCache["uStar"], this.starFloat);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projMat"], false, projMat);
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