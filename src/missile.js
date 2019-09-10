import { mat4, vec3 } from "./lib/gl-matrix";
import {
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/vertex.glsl";
import MISSILE_TRAIL_FRAGMENT_SHADER from "./shaders/missile-trail-fragment.glsl";
import { TRAIL, QUAD_UVS, UNIFORM_NAMES } from "./models";
import Explosion from "./explosion";
import SoundEffect from "./sound-effect";

const MISSILE_TRAIL_UNIFORM_NAMES = [
  ...UNIFORM_NAMES,
  "uExplodeTime",
  "uEndTime",
  "uStartTime",
  "uGood",
  "uPercentDone",
  "uAlpha",
];

const FADE_TIME = 2000;

let program = null;
let positionBuffer = null;
let uvBuffer = null;

const goodExplodeSfx = new SoundEffect([3,,0.1265,0.7565,0.4248,0.0688,,0.0011,,,,,,,,,0.3391,-0.016,1,,,,,0.5]);
const badExplodeSfx = new SoundEffect([3,,0.3723,0.5327,0.1716,0.0352,,0.0305,,,,,,,,,0.2013,-0.188,1,,,,,0.5]);

export default class Missile {
  static configureProgram(gl) {
    program = configureProgram(gl);
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
  }

  constructor(game, launchTime, position, destination, good, speed, isBackground = false) {
    this.type = "missile";
    this.game = game;
    this.gl = this.game.gl;
    this.speed = speed;
    this.position = vec3.create();
    this.collisionPosition = vec3.create();
    this.destination = vec3.create();
    this.exploded = false;
    this.dead = false;
    this.isBackground = isBackground;
    this.collidable = true;
    this.good = good;
    this.goodFloat = good ? 1.0 : 0.0;
    vec3.copy(this.position, position);
    vec3.copy(this.destination, destination);
    const destFromOrigin = vec3.create();
    this.alpha = this.isBackground ? 0.75 : 1;
    vec3.subtract(destFromOrigin, this.destination, this.position);
    const xDirection = this.destination[0] - this.position[0];
    this.angle = vec3.angle([0, 1, 0], destFromOrigin) * -Math.sign(xDirection);
    const explodeTime = vec3.distance(this.position, this.destination) / this.speed + launchTime;
    this.times = { start: launchTime, explode: explodeTime, end: explodeTime + FADE_TIME };
    this.radius = 0.1;
    this.percentDone = 0;
    this.goodExplodeSfx = goodExplodeSfx;
    this.badExplodeSfx = badExplodeSfx;

    this.modelMatrix = mat4.create();
    const scaleMat = mat4.create();
    const rotMat = mat4.create();
    const transMat = mat4.create();

    const distance = vec3.distance(this.destination, this.position);
    mat4.scale(scaleMat, this.modelMatrix, [10, distance, 10]);
    mat4.translate(transMat, this.modelMatrix, this.position);
    mat4.rotate(rotMat, this.modelMatrix, this.angle, [0, 0, 1]);
    mat4.multiply(this.modelMatrix, rotMat, scaleMat);
    mat4.multiply(this.modelMatrix, transMat, this.modelMatrix);
    this.update(launchTime);
  }

  update(time) {
    if (time > this.times.end) this.dead = true;
    // This handles slowly fading out missiles during a game reset
    if (this.dead) this.alpha -= .01;

    if (this.exploded) return;
    this.percentDone = Math.min((time - this.times.start) / (this.times.explode - this.times.start), 1);
    vec3.lerp(this.collisionPosition, this.position, this.destination, this.percentDone);
  }

  draw(time) {
    const { gl, modelMatrix, goodFloat } = this;
    const { viewMatrix, projectionMatrix } = this.game;

    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, TRAIL);
    setUvs(gl, program, uvBuffer, QUAD_UVS);
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform1f(program.uniformsCache["uGood"], goodFloat);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projectionMatrix"], false, projectionMatrix);
    gl.uniform1f(program.uniformsCache["uExplodeTime"], this.times.explode);
    gl.uniform1f(program.uniformsCache["uStartTime"], this.times.start);
    gl.uniform1f(program.uniformsCache["uEndTime"], this.times.end);
    gl.uniform1f(program.uniformsCache["uPercentDone"], this.percentDone);
    gl.uniform1f(program.uniformsCache["uAlpha"], this.alpha);
    gl.drawArrays(gl.TRIANGLES, 0, TRAIL.length / 3);
    gl.disable(gl.DEPTH_TEST);
  }

  maybeExplode(time) {
    if (this.percentDone >= 1.0 && !this.exploded) {
      this.explode(time);
      return true;
    }

    return false;
  }

  explode(time) {
    if (this.exploded) return;
    const explosion = new Explosion(this.game, time, this.collisionPosition, this.good);
    if (this.percentDone >= 1.0 && !this.good) explosion.collidable = false;
    this.game.drawables.push(explosion);
    this.times.explode = time;
    this.times.end = time + FADE_TIME;
    this.exploded = true;
    this.collidable = false;
    if (this.good) {
      this.goodExplodeSfx.play();
    } else {
      this.badExplodeSfx.play();
    }
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