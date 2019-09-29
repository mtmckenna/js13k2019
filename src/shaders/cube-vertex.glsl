attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMat;

varying vec2 vUvs;

void main() {
  vec4 worldPos = modelMatrix * vec4(aPosition, 1);
  vUvs = aUvs;

  gl_Position = projMat * viewMatrix * worldPos;
}