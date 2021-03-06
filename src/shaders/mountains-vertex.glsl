precision highp float;

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMat;
uniform mat4 normalMatrix;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec2 vUvs;
varying vec3 vLight;

void main() {
  vNormal = aNormal;
  float light = dot(normalize(aNormal), normalize(uLightPosition));
  vLight = uLightColor * light;
  gl_Position = projMat * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
}
