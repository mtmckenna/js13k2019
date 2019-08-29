attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;

varying vec3 vPosition;
varying vec2 vUvs;
varying vec4 vWorldPos;
varying vec3 vLighting;

void main() {
  vec4 transformedNormal = normalMatrix * vec4(aNormal, 1.0);
  float directional = max(dot(transformedNormal.xyz, uLightDirection), 0.0);

  vLighting = uLightColor * directional + .1;
  vPosition = aPosition;
  vUvs = aUvs;
  vWorldPos = modelMatrix * vec4(aPosition, 1);

  gl_Position = projectionMatrix * viewMatrix * vWorldPos;
}