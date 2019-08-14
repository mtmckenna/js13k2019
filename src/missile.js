import { mat4, vec3 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import MISSILE_TRAIL_FRAGMENT_SHADER from "./shaders/missile-trail-fragment.glsl";
import { TRAIL, PLANE_UVS, UNIFORM_NAMES } from "./models";
import Explosion from "./explosion";

const MISSILE_TRAIL_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uColor",
  "uExplodeTime",
  "uEndTime",
  "uStartTime",
  "uGood",
];

let program = null;
let positionBuffer = null;
let uvBuffer = null;

export default class Missile {

  static configureProgram(gl) {
    program = configureProgram(gl);
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  constructor(game, launchTime, destination = [1.0, 2.0, 0.0], good = true) {
    this.game = game;
    this.gl = this.game.gl;
    this.speed = 0.0019;
    this.position = [0, 0, 0];
    this.exploded = false;
    this.dead = false;
    this.good = good ? 1.0 : 0.0;
    this.destination = [destination[0], destination[1], destination[2]];
    this.angle = vec3.angle([0, 1, 0], this.destination) * Math.sign(this.destination[0]);
    const explodeTime = vec3.distance(this.position, this.destination) / this.speed + launchTime;
    this.times = { start: launchTime, explode: explodeTime, end: explodeTime + 2000 };

    this.modelMatrix = mat4.create();
    this.vertices = TRAIL;
  }

  update(time) {
    const percentDone = (time - this.times.start) / (this.times.explode - this.times.start);
    if (time > this.times.end) this.dead = true;
    if (percentDone >= 1.0 && !this.exploded) this.explode(time);
  }

  draw(time) {
    const { gl, modelMatrix, vertices, good } = this;
    const { viewMatrix, projectionMatrix } = this.game;

    const length = vec3.length(this.destination);
    mat4.identity(modelMatrix);
    mat4.rotate(modelMatrix, modelMatrix, this.angle, [0, 0, 1]);
    mat4.scale(modelMatrix, modelMatrix, [1, length, 1]);
    mat4.translate(modelMatrix, modelMatrix, [0, 0.5, 0]);

    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, vertices);
    setUvs(gl, program, uvBuffer, PLANE_UVS);
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform1f(program.uniformsCache["uGood"], good);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    gl.uniform3f(program.uniformsCache["uColor"], 0.0, 0.0, 1.0);
    gl.uniform1f(program.uniformsCache["uExplodeTime"], this.times.explode);
    gl.uniform1f(program.uniformsCache["uStartTime"], this.times.start);
    gl.uniform1f(program.uniformsCache["uEndTime"], this.times.end);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
  }

  explode(time) {
    const explosion = new Explosion(this.game, time, this.destination, this.good);
    this.game.drawables.push(explosion);
    this.exploded = true;
  }
}

function configureProgram(gl) {
  const program = programFromCompiledShadersAndUniformNames(
    gl,
    VERTEX_SHADER,
    MISSILE_TRAIL_FRAGMENT_SHADER,
    MISSILE_TRAIL_UNIFORM_NAMES,
  );

  return program;
}