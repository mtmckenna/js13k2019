precision highp float;

uniform vec3 uColor;
uniform float uFadeDistance;
uniform vec3 uLightPosition;

varying vec3 vPosition;
varying vec2 vUvs;
varying vec4 vWorldPos;
varying vec3 vLighting;

void main() {
  //  gl_FragColor = vec4(uColor.xyz, 1.0);  
  // float alpha = 1.0 - vPosition.z / uFadeDistance;
  // float alpha = vWorldPos.z / 25.0;

  // vec4 distanceToLight = vec4(uLightPosition.xyz, 1.0) - vWorldPos;
  float distanceToLight = uLightPosition.z - vWorldPos.z;
  float distance = length(distanceToLight);
  // float attenuation = clamp(3.0 / distance, 0.0, 1.0);
  float c1 = 0.1;
  float c2 = 0.0;
  float attenuation = 1.0/(1.0 + c1*distance + c1*distance*distance);
  attenuation = clamp(attenuation, 0.0, 1.0);



  gl_FragColor = vec4(uColor.xyz * vLighting, 1.0 * attenuation);
}
