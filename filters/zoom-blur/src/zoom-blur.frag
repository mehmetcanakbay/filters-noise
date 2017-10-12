varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterArea;

uniform vec2 uCenter;
uniform float uStrength;
uniform float uInnerRadius;
uniform float uRadius;

float random(vec3 scale, float seed) {
    // use the fragment position for a different seed per-pixel
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

void main() {

    vec2 center = uCenter.xy / filterArea.xy;
    vec2 dir = vec2(center - vTextureCoord);
    float dist = length(vec2(dir.x, dir.y * filterArea.y / filterArea.x));

    float strength = uStrength;

    const float count = 32.0;
    float countLimit = count;

    float minGradient = uInnerRadius * 0.3;
    float gradient = uRadius * 0.3;

    float innerRadius = (uInnerRadius + minGradient * 0.5) / filterArea.x;
    float radius = (uRadius - gradient * 0.5) / filterArea.x;

    float delta = 0.0;
    float gap;
    if (dist < innerRadius) {
        delta = innerRadius - dist;
        gap = minGradient;
    } else if (dist > radius) {
        delta = dist - radius;
        gap = gradient;
    }

    if (delta > 0.0) {
        float normalCount = gap / filterArea.x;
        delta = (normalCount - delta) / normalCount;
        countLimit *= delta;
        strength *= delta;
        if (countLimit < 1.0)
        {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
            return;
        }
    }

    // randomize the lookup values to hide the fixed number of samples
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

    float total = 0.0;
    vec4 color = vec4(0.0);

    dir *= strength;

    for (float t = 0.0; t < count; t++) {
        float percent = (t + offset) / count;
        float weight = 4.0 * (percent - percent * percent);
        vec2 p = vTextureCoord + dir * percent;
        vec4 sample = texture2D(uSampler, p);

        // switch to pre-multiplied alpha to correctly blur transparent images
        sample.rgb *= sample.a;

        color += sample * weight;
        total += weight;

        if (t > countLimit){
            break;
        }
    }

    gl_FragColor = color / total;

    // switch back from pre-multiplied alpha
    gl_FragColor.rgb /= gl_FragColor.a + 0.00001;
}