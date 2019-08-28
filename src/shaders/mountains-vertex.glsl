precision highp float;

attribute vec3 aPosition;
attribute vec2 aUvs;
attribute vec3 aNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

varying vec3 vNormal;
varying vec2 vUvs;

void main() {
  vNormal = aNormal;
  vUvs = aUvs;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
}
