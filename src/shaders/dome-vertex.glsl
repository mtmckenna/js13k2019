precision highp float;

attribute vec3 aPosition;
attribute vec2 aUvs;
attribute vec3 aNormal;

uniform vec4 uLightPosition;
uniform vec3 uKd;
uniform vec3 uLd;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUvs;
varying vec3 vLightIntensity;

void main() {
  vec3 tnorm = normalize(aNormal);
  vec4 eyeCoords = viewMatrix * modelMatrix * vec4(aPosition, 1.0);
  vec3 s = normalize(vec3(uLightPosition - eyeCoords));

  vLightIntensity = uLd * uKd * max(dot(s, tnorm), 0.0);

  vUvs = aUvs;
  // Convert position to clip coords and pass along.
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
}
