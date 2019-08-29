precision highp float;

uniform vec3 uColor;
uniform vec3 uLightPosition;

varying vec4 vWorldPos;
varying vec3 vPosition;
varying vec3 vLighting;
varying vec2 vUvs;

float c1 = 0.01;
float c2 = 0.003;

void main() {
  vec4 distanceToLight = vec4(uLightPosition.xyz, 1.0) - vWorldPos;
  float distance = length(distanceToLight);
  float attenuation = 1.0/(1.0 + c1*distance + c2*distance*distance);
  attenuation = clamp(attenuation, 0.0, 1.0);

  gl_FragColor = vec4(uColor.xyz * vLighting, attenuation);
}
