import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

/**
 * Icono "ICONO" del frame Figma "PERMISO CONCEDIDO" (2349:911, nodo 2349:919).
 * Path exportado verbatim desde Figma (asset cf6966f9-f5f9-4409-8ded-e0f7a04e7de1.svg,
 * guardado en apps/mobile/assets/access/sesion-icono.svg) — mismo patrón de
 * Svg/Path a mano que components/icons/OppositionIcons.js, ya que el proyecto
 * no tiene configurado un transformer de metro para importar .svg directamente.
 */
export const SesionCheckIcon = ({ width = 96, color = '#3AB375' }) => {
    const height = width * (127 / 170);
    return (
        <Svg width={width} height={height} viewBox="0 0 170 127" fill="none">
            <Path
                d="M165.036 2.9594C166.868 4.72818 168.259 6.90205 169.096 9.30592C169.933 11.7098 170.193 14.2764 169.855 16.7992C167.929 21.3132 165.638 24.313 162.207 27.6884L160.882 29.0119L73.9791 116.559C68.3789 122.816 63.742 127.749 54.827 126.905C50.7159 125.175 47.0056 122.617 43.9275 119.391L42.5419 118.067L38.1423 113.675L35.131 110.606L20.4365 95.9827L6.88158 82.4435L4.47491 79.9755C2.52678 77.9278 1.14678 75.4079 0.471098 72.6647C-0.204587 69.9214 -0.152602 67.0495 0.621922 64.3324C3.39017 58.7982 7.36465 55.6078 13.4507 55.0067C25.1341 56.0268 35.3133 70.6498 43.1436 78.5913L47.8412 83.3452L49.2876 84.7901C54.7084 90.2058 54.7084 90.2058 59.6461 90.2058C64.8239 87.0789 69.0992 82.0823 73.3774 77.811L131.794 18.4956L141.849 8.43867L143.584 6.63248C150.223 0.014585 156.425 -2.45051 165.036 2.96518"
                fill={color}
            />
        </Svg>
    );
};

/**
 * Icono de escaneo facial del frame Figma "FACE ID" (2349:362, nodo 2349:372).
 * APROXIMACIÓN: no se pudo exportar el path vectorial exacto (cuota del MCP
 * de Figma agotada) — es un marco de 4 esquinas + carita fiel al estilo
 * visual observado en el screenshot, no el asset verbatim. Reemplazar por
 * el SVG real exportado de Figma en cuanto se restablezca la cuota.
 */
export const FaceScanIcon = ({ size = 100, color = '#412950' }) => {
    const corner = size * 0.22;
    const stroke = Math.max(2, size * 0.03);
    const inset = stroke;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
            <Path
                d={`M ${inset} ${inset + corner} V ${inset} H ${inset + corner}`}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d={`M ${size - inset - corner} ${inset} H ${size - inset} V ${inset + corner}`}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d={`M ${inset} ${size - inset - corner} V ${size - inset} H ${inset + corner}`}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d={`M ${size - inset - corner} ${size - inset} H ${size - inset} V ${size - inset - corner}`}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
            <Circle cx={size * 0.38} cy={size * 0.44} r={size * 0.035} fill={color} />
            <Circle cx={size * 0.62} cy={size * 0.44} r={size * 0.035} fill={color} />
            <Path
                d={`M ${size * 0.36} ${size * 0.58} Q ${size * 0.5} ${size * 0.68} ${size * 0.64} ${size * 0.58}`}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    );
};

/**
 * Icono de candado del frame Figma "ERROR FACE ID" #2 ("Cuenta bloqueada
 * temporalmente", 2349:872). APROXIMACIÓN — no se pudo exportar el path
 * vectorial exacto (cuota del MCP de Figma agotada); cuerpo redondeado +
 * arco + ojo de cerradura, fiel al estilo observado. Reemplazar por el
 * SVG real en cuanto se restablezca la cuota.
 */
export const LockIcon = ({ size = 70, color = '#412950' }) => {
    const stroke = Math.max(2, size * 0.055);
    const bodyWidth = size * 0.56;
    const bodyHeight = size * 0.42;
    const bodyX = (size - bodyWidth) / 2;
    const bodyY = size * 0.46;
    const shackleRadius = size * 0.19;
    const shackleCx = size / 2;
    const shackleCy = bodyY;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
            <Path
                d={`M ${shackleCx - shackleRadius} ${shackleCy} V ${shackleCy - shackleRadius} A ${shackleRadius} ${shackleRadius} 0 0 1 ${shackleCx + shackleRadius} ${shackleCy - shackleRadius} V ${shackleCy}`}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
            <Rect
                x={bodyX}
                y={bodyY}
                width={bodyWidth}
                height={bodyHeight}
                rx={size * 0.08}
                fill={color}
            />
            <Rect
                x={size / 2 - size * 0.035}
                y={bodyY + bodyHeight * 0.32}
                width={size * 0.07}
                height={size * 0.16}
                rx={size * 0.02}
                fill="#FFFFFF"
            />
        </Svg>
    );
};

export default SesionCheckIcon;
