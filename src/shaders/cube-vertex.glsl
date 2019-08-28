attribute vec3 aPosition;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec3 vPosition;
varying vec2 vUvs;
varying vec4 vWorldPos;

void main() {
  vWorldPos = modelMatrix * vec4(aPosition, 1);
  gl_Position = projectionMatrix * viewMatrix * vWorldPos;
  vPosition = aPosition;
  vUvs = aUvs;
}