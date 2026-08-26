// Datos centralizados del Bloque 3 · Salud.
// Fuente única para MenusScreen → MenuDetailScreen y MeditationListScreen → MeditationPlayerScreen.

export const MENUS_DATA = [
    {
        id: 'm1',
        type: 'AI',
        title: 'Día de concentración máxima',
        subtitle: 'Menú generado y revisado automáticamente',
        highlighted: true,
        filterKey: 'Concentración',
        meals: [
            { id: 'desayuno', label: 'DESAYUNO', name: 'Avena con arándanos y nueces', note: '320 kcal · omega-3 + antioxidantes' },
            { id: 'comida', label: 'COMIDA', name: 'Salmón con quinoa y verduras', note: '540 kcal' },
            { id: 'cena', label: 'CENA', name: 'Tortilla y aguacate', note: '390 kcal · proteína + grasas saludables' },
        ],
    },
    {
        id: 'm2',
        type: 'Dietista',
        title: 'Energía sostenida',
        subtitle: 'Por Laura M., dietista col. nº 1234',
        highlighted: false,
        filterKey: 'Energía',
        meals: [
            { id: 'desayuno', label: 'DESAYUNO', name: 'Tostadas integrales con hummus', note: '280 kcal · fibra + proteína vegetal' },
            { id: 'comida', label: 'COMIDA', name: 'Pollo al horno con batata y brócoli', note: '520 kcal' },
            { id: 'cena', label: 'CENA', name: 'Crema de calabaza y pan integral', note: '320 kcal' },
        ],
    },
    {
        id: 'm3',
        type: 'Dietista',
        title: 'Recuperación post-examen',
        subtitle: 'Por Carlos R., dietista col. nº 5678',
        highlighted: false,
        filterKey: 'Día de examen',
        meals: [
            { id: 'desayuno', label: 'DESAYUNO', name: 'Yogur con granola y fresas', note: '260 kcal · probióticos + antioxidantes' },
            { id: 'comida', label: 'COMIDA', name: 'Lentejas con verduras salteadas', note: '480 kcal' },
            { id: 'cena', label: 'CENA', name: 'Pasta integral con salsa de tomate', note: '400 kcal · carbohidratos de recuperación' },
        ],
    },
];

// audioKey debe coincidir con las claves de AUDIO_FILES en MeditationPlayerScreen.js.
export const MEDITATIONS = {
    recommended: {
        id: '1',
        title: 'Calma antes del examen',
        audioKey: 'Calma antes del examen',
        note: 'gestión de la ansiedad',
        duration: '8 min',
    },
    exercises: [
        { id: '2', title: 'Respiración 4-7-8', audioKey: 'Respiración 4-7-8', note: 'relajación rápida', duration: '5 min' },
        { id: '3', title: 'Bajar la activación', audioKey: 'Bajar la activación', note: 'tras una sesión intensa', duration: '7 min' },
        { id: '4', title: 'Foco en 3 minutos', audioKey: 'Foco en 3 minutos', note: 'antes de empezar a estudiar', duration: '3 min' },
    ],
};
