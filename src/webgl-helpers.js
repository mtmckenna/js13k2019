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

function cacheUniformLocations(gl, program, uniformNames) {
  uniformNames.forEach(function (uniformName) {
    cacheUniformLocation(gl, program, uniformName);
  });
}

export function setPosition(gl, program, buffer, vertices) {
  configureBuffer(gl, program, buffer, vertices, 3, "aPosition");
}

export function setUvs(gl, program, buffer, uvs) {
  configureBuffer(gl, program, buffer, uvs, 2, "aUvs");
}

export function randomNumBetween(min, max) {
  return Math.random() * (max - min) + min;
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
