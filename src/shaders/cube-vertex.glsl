attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUvs;

uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;

varying vec3 vPosition;
varying vec2 vUvs;
varying vec4 vWorldPos;
varying vec3 vLighting;

void main() {
  vWorldPos = modelMatrix * vec4(aPosition, 1);
  vec4 lightWorldPos = modelMatrix * vec4(uLightPosition, 1);

  vec4 transformedNormal = normalMatrix * vec4(aNormal, 1.0);
  vec4 distanceToLight = normalize(vec4(uLightPosition, 1) - vWorldPos);
  float directional = max(dot(transformedNormal, distanceToLight), 0.0);

  vLighting = uLightColor * directional + .5;
  vPosition = aPosition;
  vUvs = aUvs;

  gl_Position = projectionMatrix * viewMatrix * vWorldPos;
}