precision highp float;

uniform vec3 uColor;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform vec4 uLightPosition;
uniform vec3 uKd;
uniform vec3 uLd;

varying vec3 vLightIntensity;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {



  highp vec4 tnorm = normalMatrix * vec4(normalize(vNormal), 1.0);
  highp vec4 eyeCoords = viewMatrix * modelMatrix * vec4(vPosition, 1.0);
  highp vec3 s = normalize(vec4(10.0, -10.0, -10.0, 1.0) - eyeCoords).xyz;
  vec3 LightIntensity = uLd * uKd * max(dot(s, tnorm.xyz), 0.0);
  gl_FragColor = vec4(LightIntensity, 0.3);



  // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  // gl_FragColor = vec4(vLightIntensity, 0.3);
}

