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

  constructor(game, launchTime, position, destination, good = true) {
    this.game = game;
    this.gl = this.game.gl;
    this.speed = 0.0019;
    this.position = [position[0], position[1], position[2]];
    this.exploded = false;
    this.dead = false;
    this.good = good ? 1.0 : 0.0;
    this.destination = destination;
    const destFromOrigin = vec3.create();
    vec3.subtract(destFromOrigin, this.destination, this.position);
    const xDirection = this.destination[0] - this.position[0];
    this.angle = vec3.angle([0, 1, 0], destFromOrigin) * Math.sign(xDirection);
    const explodeTime = vec3.distance(this.position, this.destination) / this.speed + launchTime;
    this.times = { start: launchTime, explode: explodeTime, end: explodeTime + 2000 };
    this.vertices = TRAIL;

    this.modelMatrix = mat4.create();
    const scaleMat = mat4.create();
    const rotMat = mat4.create();
    const transMat = mat4.create();
    const modMat = mat4.create();

    const distance = vec3.distance(this.destination, this.position);
    mat4.scale(scaleMat, this.modelMatrix, [1, distance, 1]);
    mat4.translate(transMat, this.modelMatrix, [-this.position[0], this.position[1], 0]);
    mat4.rotate(rotMat, this.modelMatrix, this.angle, [0, 0, 1]);
    mat4.multiply(modMat, rotMat, scaleMat);
    mat4.multiply(modMat, transMat, modMat);
    mat4.copy(this.modelMatrix, modMat);
  }

  update(time) {
    const percentDone = (time - this.times.start) / (this.times.explode - this.times.start);
    if (time > this.times.end) this.dead = true;
    if (percentDone >= 1.0 && !this.exploded) this.explode(time);
  }

  draw(time) {
    const { gl, modelMatrix, vertices, good } = this;
    const { viewMatrix, projectionMatrix } = this.game;

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