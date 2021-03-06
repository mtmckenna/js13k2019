export function programFromCompiledShadersAndUniformNames(gl, vertexShader, fragmentShader, uniformNames) {
  let compiledVertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  let compiledFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  let newProgram = linkShader(gl, compiledVertexShader, compiledFragmentShader);
  cacheUniformLocations(gl, newProgram, uniformNames);
  return newProgram;
}

// modified from https://nickdesaulniers.github.io/RawWebGL/#/51
export function configureBuffer(gl, program, buffer, data, elemPerVertex, attributeName) {
  let attributeLocation = gl.getAttribLocation(program, attributeName);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(attributeLocation, elemPerVertex, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attributeLocation);
}

export function configureArrayBuffer(gl, buffer, indices) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function cacheUniformLocations(gl, program, uniformNames) {
  uniformNames.forEach(function (uniformName) {
    cacheUniformLocation(gl, program, uniformName);
  });
}

export function setNormal(gl, program, buffer, vertices) {
  configureBuffer(gl, program, buffer, vertices, 3, "aNormal");
}

export function setPosition(gl, program, buffer, vertices) {
  configureBuffer(gl, program, buffer, vertices, 3, "aPosition");
}

export function setUvs(gl, program, buffer, uvs) {
  configureBuffer(gl, program, buffer, uvs, 2, "aUvs");
}

export function randomFloatBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomIntBetween(min, max) {
  return Math.floor(randomFloatBetween(min, max + 1));
}

export function oneOrMinusOne() {
  return Math.round(Math.random()) * 2 - 1;
}

export function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}

// https://nickdesaulniers.github.io/RawWebGL/#/40
function compileShader(gl, type, shaderSrc) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

// https://nickdesaulniers.github.io/RawWebGL/#/41
function linkShader(gl, vertexShader, fragmentShader) {
  let newProgram = gl.createProgram();
  gl.attachShader(newProgram, vertexShader);
  gl.attachShader(newProgram, fragmentShader);
  gl.linkProgram(newProgram);

  if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(newProgram));
  }

  return newProgram;
}

// http://mrdoob.com/projects/glsl_sandbox/
function cacheUniformLocation(gl, program, label) {
  if (!program.uniformsCache) {
    program.uniformsCache = {};
  }

  program.uniformsCache[label] = gl.getUniformLocation(program, label);
}
