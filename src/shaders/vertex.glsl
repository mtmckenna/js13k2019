precision highp float;

attribute vec3 aPosition;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMat;

varying vec2 vUvs;
varying vec2 vSeed;

void main() {
  vUvs = aUvs;
  gl_Position = projMat * viewMatrix * modelMatrix * vec4(aPosition,1);
}