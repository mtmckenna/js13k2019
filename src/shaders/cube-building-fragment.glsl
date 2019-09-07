precision highp float;

uniform float uDead;
uniform vec3 uColor;
uniform vec3 uLightPosition;
varying vec3 vLighting;
varying vec2 vUvs;

void main() {
    vec3 windowColor = vec3(.7, .7, 0.0);
    vec3 wallColor = vec3(.1, .1, .1);

    float gutter = 0.05;
    vec2 windows = vec2(4.0, 4.0) * (1.0 - uDead);

    float blX = step(gutter, mod(vUvs.x, 1.0 / windows.x));
    float blY = step(gutter, mod(vUvs.y, 1.0 / windows.y));
	  float pct = blX * blY;

    float trX = step(gutter, mod((1.0 - vUvs.x), 1.0 / windows.x));
    float trY = step(gutter, mod((1.0 - vUvs.y), 1.0 / windows.y));
	  pct *= trX * trY;

    float inversePct = 1.0 - pct;
    vec3 color = (vec3(pct * windowColor + inversePct * wallColor) + .2);

    gl_FragColor = vec4(color * vLighting, 1.0);
}
