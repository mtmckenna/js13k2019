attribute vec3 aPosition;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUvs;

void main() {
  gl_Position = projectionMatrix * viewMatrix *modelMatrix * vec4(aPosition, 1);
}