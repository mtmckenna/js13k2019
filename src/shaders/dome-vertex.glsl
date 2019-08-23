precision highp float;
// precision highp vec3;
// precision highp vec4;


attribute vec3 aPosition;
attribute vec2 aUvs;
attribute vec3 aNormal;

uniform vec4 uLightPosition;
uniform vec3 uKd;
uniform vec3 uLd;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

varying vec3 vLightIntensity;
varying vec3 vNormal;
varying vec3 vPosition;


void main() {
  highp vec4 tnorm = normalMatrix * vec4(normalize(aNormal), 1.0);
  // vec4 tnorm = vec4(normalize(aNormal), 1.0);
  highp vec4 eyeCoords = viewMatrix * modelMatrix * vec4(aPosition, 1.0);
  highp vec3 s = normalize(vec3(uLightPosition - eyeCoords));

  vPosition = aPosition;
  vNormal = aNormal;
  vLightIntensity = uLd * uKd * max(dot(s, tnorm.xyz), 0.0);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
}
