#ifdef GL_ES
precision mediump float;
#extension GL_OES_standard_derivatives : enable
#endif

uniform vec2 u_resolution;
uniform float u_time;

mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}

float lineAlpha(float d,float halfWidth){
    float aa=fwidth(d);
    return 1.0-smoothstep(halfWidth-aa,halfWidth+aa,d);
}

// Funcionones para la aleatoriedad 
float hash(float x){
    return fract(sin(x*123.456)*9876.543);
}

vec3 hash3(float x){
    return vec3(
        hash(x+1.0),
        hash(x+2.0),
        hash(x+3.0)
    );
}

// función que dibuja un anillo entrelazado
vec3 ring(vec2 uv, vec2 offset, float id){
    uv -= offset;

    // perspectiva
    float perspective = 0.680;
    uv.y *= 1.1;
    float depthScale = 0.96 + uv.y * perspective * 0.5;
    uv *= depthScale;

    float tilt = 0.664;
    vec2 p = uv;
    p.y *= tilt;
    p *= rot(radians(-25.0));

    // parámetros del anillo
    float R = 0.112;

    // veolcidad aleatoria por anillo
    float speed = mix(0.9, 5.5, hash(id));

    // entrelazado aleatorio por anillo
    float twistN = 6.0 + hash(id+10.0)*10.0;

    // animación usando la velocidad aleatoria
    float anim = u_time * speed;

    // amplitud aleatoria
    float ampR = (hash(id+20.0)-0.5) * 0.02;

    vec3 colA = hash3(id + 30.0);
    vec3 colB = hash3(id + 40.0);

    colA = mix(vec3(0.2), colA, 0.8);
    colB = mix(vec3(0.2), colB, 0.8);

    float tubeW = 0.003;

    float a = atan(p.y,p.x);
    float z1 = 0.6 + 0.4*sin(twistN*a+anim);
    float z2 = 0.6 + 0.4*sin(twistN*a+anim+3.14159265);
    float s1 = ampR*cos(twistN*a+anim);
    float s2 = ampR*cos(twistN*a+anim+3.14159265);

    float d1 = abs(length(p)-(R+s1));
    float d2 = abs(length(p)-(R+s2));

    float a1 = lineAlpha(d1,tubeW);
    float a2 = lineAlpha(d2,tubeW);

    float topIs1 = step(z2,z1);
    float overlap = a1*a2;
    float shadow = 0.55;
    a1 = mix(a1,a1*(1.0-overlap*(1.0-topIs1)*(1.0-shadow)),1.0);
    a2 = mix(a2,a2*(1.0-overlap*(topIs1)*(1.0-shadow)),1.0);

    vec3 L = normalize(vec3(-0.3,0.5,0.8));
    vec3 n1 = normalize(vec3(cos(a),sin(a)*tilt,z1-0.6));
    vec3 n2 = normalize(vec3(cos(a),sin(a)*tilt,z2-0.6));
    float diff1 = clamp(dot(n1,L),0.0,1.0);
    float diff2 = clamp(dot(n2,L),0.0,1.0);

    vec3 c1 = colA*(0.25+0.75*diff1);
    vec3 c2 = colB*(0.25+0.75*diff2);

    vec3 underCol = mix(c2,c1,topIs1);
    float underA = mix(a2,a1,topIs1);

    vec3 overCol = mix(c1,c2,topIs1);
    float overA = mix(a1,a2,topIs1);

    vec3 col = vec3(0.0);
    col = mix(col,underCol,underA);
    col = mix(col,overCol,overA);

    float spec1 = pow(max(dot(reflect(-L,n1),normalize(vec3(p,0.8))),0.0),32.0);
    float spec2 = pow(max(dot(reflect(-L,n2),normalize(vec3(p,0.8))),0.0),32.0);
    float spec = mix(spec2,spec1,topIs1);
    col += 0.08*spec*(a1+a2);

    float alpha = clamp(a1+a2,0.0,1.0);
    return col*alpha;
}

void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution) / u_resolution.y;

    // fondo
    vec3 col = vec3(0.03,0.04,0.08);
    float vign = smoothstep(1.3,0.2,length(uv));
    col = mix(col, vec3(0.1,0.08,0.15), vign);

    // grid de anillos
    const int ROWS = 6;
    const int COLS = 14; 
    const float spacingX = 0.18;
    const float spacingY = 0.22;
    const float rowShift = 0.10;

    int id = 1;

    for (int j = 0; j < ROWS; j++) {

        // posición vertical base
        float y = (float(j) - float(ROWS-1)*0.5) * -spacingY;

        // respiración suave por fila
        float breathSpeed = 1.0;          	// velocidad de respiración
        float breathAmp   = 0.05;         	// amplitud de movimiento
        float phase       = float(j) * 0.4; // desfase entre filas

        y += sin(u_time * breathSpeed + phase) * breathAmp;
    

        for (int i = 0; i < COLS; i++) {

            float shift = float(j) * rowShift;

            float x = (float(i) - float(COLS-1)*0.5) * spacingX + shift;
            float shiftWave = sin(u_time * 0.4 + float(j)*0.7) * 0.05;
			x += shiftWave;

            vec2 offset = vec2(x, y);

            col += ring(uv, offset, float(id));
            id++;
        }
    }


    gl_FragColor = vec4(col,1.0);
}
