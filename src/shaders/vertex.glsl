precision mediump float;

attribute vec3 aPosition;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUvs;

void main() {
  vUvs = aUvs;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition,1);
}