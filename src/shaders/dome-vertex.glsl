precision highp float;

attribute vec3 aPosition;
attribute vec2 aUvs;
attribute vec3 aNormal;

uniform vec4 uLightPosition;
uniform vec3 uKd;
uniform vec3 uLd;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMat;
uniform mat4 normalMatrix;

varying vec3 vLightIntensity;
varying vec2 vUvs;

void main() {
  highp vec4 transformedNormal = normalMatrix * vec4(normalize(aNormal), 1.0);
  highp vec4 eyeCoords = viewMatrix * modelMatrix * vec4(aPosition, 1.0);
  highp vec3 s = normalize(vec3(uLightPosition - eyeCoords));

  vLightIntensity = 6.4 * uLd * uKd * max(dot(s, transformedNormal.xyz), 0.0);
  vUvs = aUvs;
  gl_Position = projMat * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
}
