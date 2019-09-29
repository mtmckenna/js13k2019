import { mat4 } from "./lib/gl-matrix";
import {
  configureBuffer,
  programFromCompiledShadersAndUniformNames,
  setPosition,
  setUvs,
  randomFloatBetween,
} from "./webgl-helpers";

import VERTEX_SHADER from "./shaders/star-vertex.glsl";
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
let seedBuffer = null;

export default class Stars {
  static configureProgram(gl) {
    program = configureProgram(gl);
    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
    seedBuffer = gl.createBuffer();
  }

  constructor(game, position, starPos) {
    this.type = "stars";
    this.game = game;
    this.gl = this.game.gl;
    this.position = position;
    this.dead = false;
    this.collidable = false;
    this.starFloat = 1.0;
    this.modelMatrix = mat4.create();
    this.radius = 0.1;
    this.starPos = starPos;
    this.numStars = starPos.length;

    // Render all the stars in one pass to improve Windows performance
    const scale = 0.5;
    const scaledQuad = QUAD.map((pos) => pos * scale);
    const positions = this.starPos.map((pos) => {
      return [
        scaledQuad[0]  + pos[0], scaledQuad[1]  + pos[1], scaledQuad[2]  + pos[2],
        scaledQuad[3]  + pos[0], scaledQuad[4]  + pos[1], scaledQuad[5]  + pos[2],
        scaledQuad[6]  + pos[0], scaledQuad[7]  + pos[1], scaledQuad[8]  + pos[2],
        scaledQuad[9]  + pos[0], scaledQuad[10] + pos[1], scaledQuad[11] + pos[2],
        scaledQuad[12] + pos[0], scaledQuad[13] + pos[1], scaledQuad[14] + pos[2],
        scaledQuad[15] + pos[0], scaledQuad[16] + pos[1], scaledQuad[17] + pos[2],
      ]
    });

    this.positions = new Float32Array([].concat(...positions));
    this.uvs = new Float32Array([].concat(...new Array(this.numStars).fill(Array.from(QUAD_UVS))));

    // first seed determines opacity of star
    // second seed determines if star twinkles
    this.seed = [];
    for (let i = 0; i < this.numStars; i++) {
      const seed1 = randomFloatBetween(0, 0.3);
      const seed2 = Math.round(randomFloatBetween(0, 0.75));
      for (let j = 0; j < 6; j++) {
        this.seed.push(seed1, seed2);
      }
    }

    this.seed = new Float32Array(this.seed);

    this.update(0);
  }

  update(time) {
    const { modelMatrix } = this;
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, this.position);
  }

  draw(time) {
    const { gl, modelMatrix } = this;
    const { viewMatrix, projMat } = this.game;
    gl.useProgram(program);
    setPosition(gl, program, positionBuffer, this.positions);
    setUvs(gl, program, uvBuffer, this.uvs);
    configureBuffer(gl, program, seedBuffer, this.seed, 2, "aSeed");
    gl.uniform1f(program.uniformsCache["uTime"], time);
    gl.uniform1f(program.uniformsCache["uStar"], this.starFloat);
    gl.uniformMatrix4fv(program.uniformsCache["modelMatrix"], false, modelMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["viewMatrix"], false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformsCache["projMat"], false, projMat);
    gl.drawArrays(gl.TRIANGLES, 0, this.positions.length / 3);
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