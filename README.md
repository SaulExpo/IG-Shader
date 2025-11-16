# Creación de Shader

Para esta práctica se optó por desarrollar un shader generativo en el editor de "The book of Shaders".

---

## Contenidos

[Motivación y surgimiento del shader](#motivación-y-surgimiento-del-shader)  

[Versiones del desarrollo](#versiones-del-desarrollo)

[Muestra final](#muestra-final)  

[Versión TinyCode](#versión-tinycode)  


## Motivación y surgimiento del shader

A la hora de empezar a desarrollar el shader la idea principal fue desarrollar algo que pareciera 3D y en forma de anillo, siguiendo un poco la siguiente idea:

<img width="532" height="437" alt="image" src="https://github.com/user-attachments/assets/65dd2c52-fb83-4ce6-a5b6-317489a51ae5" />

No obstante durante el desarrollo surfieron nuevas ideas y cambios en el proyecto
---

## Versiones del desarrollo

### 1. Círculo Entrelazado
Para empezar el proyecto creé un circulo simple con valores definidos que se constituía de 2 anillos que se entrelazaban y ocupaban toda la pantalla. 
Además se le añadían colores diferentes a cada uno de los anillos para que se viera de mejor manera.

Esta fue la versión con la que se empezó a trabajar y se usó como base para pensar en ideas posteriores. Este fue el resultado de dicha idea:

<img width="376" height="387" alt="image" src="https://github.com/user-attachments/assets/a14337ae-1b14-460b-92cb-2479cbda51a6" />

### 2. Anillos olímpicos

Visto el anillo se me ocurrió la idea de hacer en lugar de solo un círculo, añadir 5 formando la figura de los anillos olímpicos e intentar hacer algo con ellos.

<img width="200" height="150" alt="image" src="https://github.com/user-attachments/assets/bde5e77d-064e-4a43-bc9e-e022f7ef7957" />

En este punto ya se empezó planteando una función para crear cada par de anillos (función `ring()` que se explicará mas adelante) pero las posiciones de estos eran puestas a mano con el siguiente código:

```
    vec3 col = vec3(0.03,0.04,0.08);
    float vign = smoothstep(1.3,0.2,length(uv));
    col = mix(col, vec3(0.1,0.08,0.15), vign);

    vec2 o1 = vec2(-0.20,  0.10);
    vec2 o2 = vec2( 0.00,  0.10);
    vec2 o3 = vec2( 0.20,  0.10);
    vec2 o4 = vec2(-0.10, -0.08);
    vec2 o5 = vec2( 0.10, -0.08);
    vec2 o6 = vec2(-0.30, -0.08);
    vec2 o7 = vec2( 0.30, -0.08);

    col += ring(uv,o1,vec3(0.950,0.114,0.141),vec3(0.900,1.000,0.000));
    col += ring(uv,o2,vec3(0.065,0.136,1.000),vec3(0.182,1.000,0.091));
    col += ring(uv,o3,vec3(1.000,0.317,0.076),vec3(0.998,0.077,1.000));
    col += ring(uv,o4,vec3(0.713,0.717,0.750),vec3(0.016,0.080,0.032));
    col += ring(uv,o5,vec3(0.620,0.985,0.105),vec3(0.935,0.522,0.504));
    col += ring(uv,o6,vec3(0.708,0.750,0.460),vec3(0.039,0.080,0.074));
    col += ring(uv,o7,vec3(0.255,0.985,0.862),vec3(0.515,0.239,0.935));
```

Tras acabar el resultado fue el siguiente:

<img width="459" height="346" alt="image" src="https://github.com/user-attachments/assets/24857ff4-98a0-4db3-90f9-fb54d65d0f85" />

### 3. Aleatoriedad y relleno de pantalla

Una vez visto los anillos me vino a la mente la siguiente ilusión optica que me propuso la idea de hacer que los anillos giren y se rellene la pantalla con ellos, pareciéndose al efecto que esta produce:

<img width="300" height="250" alt="image" src="https://github.com/user-attachments/assets/dcf941d7-c864-45f7-b40c-ad241d0ff034" />

Para ello acabé de desarrollar la función de `ring()` la cual es el núcleo visual del shader.  

A continuación se explica cada bloque de la función:

---

#### 1. Desplazamiento inicial

```glsl
uv -= offset;
```

Cada anillo se coloca en su posición dentro del grid.
Se resta el offset para que el cálculo local del anillo se haga alrededor de su centro.


#### 2. Perspectiva y profundidad simulada

```
float perspective = 0.680;
uv.y *= 1.1;
float depthScale = 0.96 + uv.y * perspective * 0.5;
uv *= depthScale;
```
Introduce una deformación vertical que simula:

Perspectiva, profundidad y una ligera curvatura del anillo.


#### 3. Inclinación y rotación del anillo

```
float tilt = 0.664;
vec2 p = uv;
p.y *= tilt;
p *= rot(radians(-25.0));
```
`tilt` aplasta la forma verticalmente, creando elíptica.
La rotación de -25° refuerza la perspectiva lateral.

#### 4. Radio del anillo

```
float R = 0.112;
```

#### 5. Parámetros aleatorios por anillo

- Velocidad de animación
  `float speed = mix(0.9, 5.5, hash(id));`
- Cantidad de torsiones
  `float twistN = 6.0 + hash(id+10.0)*10.0;`
- Amplitud radial
  `float ampR = (hash(id+20.0)-0.5) * 0.02;`
- Colores aleatorios
```
vec3 colA = hash3(id + 30.0);
vec3 colB = hash3(id + 40.0);

colA = mix(vec3(0.2), colA, 0.8);
colB = mix(vec3(0.2), colB, 0.8);
```

#### 6. Cálculo angular y alturas de las dos bandas

```
float a = atan(p.y,p.x);
float z1 = 0.6 + 0.4*sin(twistN*a+anim);
float z2 = 0.6 + 0.4*sin(twistN*a+anim+3.14159265);
```
- a: ángulo polar del píxel.
- z1 y z2: “alturas” simuladas de las dos bandas.
- El desfase de π crea dos mitades que se cruzan.

#### 7. Distancia al borde del anillo y grosor

```
float s1 = ampR*cos(twistN*a+anim);
float s2 = ampR*cos(twistN*a+anim+3.14159265);

float d1 = abs(length(p)-(R+s1));
float d2 = abs(length(p)-(R+s2));

float a1 = lineAlpha(d1,tubeW);
float a2 = lineAlpha(d2,tubeW);
```

- 1, d2: distancia al tubo principal.
- a1, a2: máscaras suavizadas usando fwidth.

#### 8. Determinación del entrelazado (qué banda pasa encima)

```
float topIs1 = step(z2,z1);
float shadow = 0.55;
a1 = mix(a1,a1*(1.0-overlap*(1.0-topIs1)*(1.0-shadow)),1.0);
a2 = mix(a2,a2*(1.0-overlap*(topIs1)*(1.0-shadow)),1.0);
```
Si z1 > z2, la banda 1 está delante.
Cuando las dos bandas coinciden, una queda por debajo, recibe sombra y sse atenúa su alpha para crear el efecto trenzado.

#### 9. Iluminación difusa simulada

```
vec3 L = normalize(vec3(-0.3,0.5,0.8));
vec3 n1 = normalize(vec3(cos(a),sin(a)*tilt,z1-0.6));
vec3 n2 = normalize(vec3(cos(a),sin(a)*tilt,z2-0.6));
float diff1 = clamp(dot(n1,L),0.0,1.0);
float diff2 = clamp(dot(n2,L),0.0,1.0);
```
Se generan normales 3D sintetizadas a partir del ángulo y la altura.

#### 10. Cálculo del color de cada banda

```
vec3 c1 = colA*(0.25+0.75*diff1);
vec3 c2 = colB*(0.25+0.75*diff2);
```
Combina el color aleatorio con la iluminación difusa,

#### 11. Composición de bandas superior e inferior

```
vec3 underCol = mix(c2,c1,topIs1);
float underA = mix(a2,a1,topIs1);

vec3 overCol = mix(c1,c2,topIs1);
float overA = mix(a1,a2,topIs1);
```
Dependiendo de qué banda está arriba se mezcla su color su alpha y se mantiene el entrelazado.

#### 12. Iluminación especular

```
float spec1 = pow(max(dot(reflect(-L,n1),normalize(vec3(p,0.8))),0.0),32.0);
float spec2 = pow(max(dot(reflect(-L,n2),normalize(vec3(p,0.8))),0.0),32.0);
float spec = mix(spec2,spec1,topIs1);
col += 0.08*spec*(a1+a2);
```

Añade un brillo puntual que simula material metálico o plástico.

#### 13. Alpha final

```
float alpha = clamp(a1+a2,0.0,1.0);
return col*alpha;
```
float alpha = clamp(a1+a2,0.0,1.0);
return col*alpha;

Al acabar, se obtuvo el siguiente resultado:

<img width="558" height="591" alt="image" src="https://github.com/user-attachments/assets/dbef9c06-a3d2-4041-bdec-a97e18c083d0" />

## Muestra Final

Para acabar y añadir un mejor efecto, se decidió añadir un efecto de desplazamiento en los ejes x e y para dar sensación de respirar, asi como crear todos los anillos para que se posicionen direcamente en un grid de la siguiente manera:

```
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
```

El resultado del shader se ve en el siguiente gif:

![chrome_2SYvNMYMZF](https://github.com/user-attachments/assets/e06477ac-00bb-4ae1-90c8-50cea664765d)

---

## Versión TinyCode

Para desarrollar una version tinyCode ajustándose a lo que pide la entrega, también se ha desarrollado dicha versión que se encuentra subida al repositorio. El resultado para que pudiera ajustarse a los 512Bytes se asemeja al realizado en la primera versión del proyecto

<img width="376" height="387" alt="image" src="https://github.com/user-attachments/assets/a14337ae-1b14-460b-92cb-2479cbda51a6" />


Saúl Expósito Morales
