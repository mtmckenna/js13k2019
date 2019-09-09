attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUvs;
varying vec4 vWorldPos;
varying vec3 vLighting;

void main() {
  vWorldPos = modelMatrix * vec4(aPosition, 1);
  vec3 transformedNormal = vec3(normalMatrix * vec4(aNormal, 1.0));

  float light = dot(normalize(transformedNormal), normalize(uLightPosition));

  vLighting = uLightColor * light + .2;
  vPosition = aPosition;
  vUvs = aUvs;
  vNormal = aNormal;

  gl_Position = projectionMatrix * viewMatrix * vWorldPos;
}