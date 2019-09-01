precision highp float;

uniform vec3 uLightPosition;
varying vec3 vNormal;
varying vec3 vLight;

void main() {
// float light = dot(vNormal, uLightPosition);

//  gl_FragColor = vec4( vec3(1.0, 1.0, 1.0), 1.0);
 gl_FragColor = vec4(vLight, 1.0);
//  gl_FragColor = vec4(vec3(1.0, 1.0, 1.0), 1.0);
}
