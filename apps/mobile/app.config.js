// Config dinámica que envuelve app.json sin duplicar su contenido.
//
// Necesaria únicamente para resolver `android.googleServicesFile` en build
// time: el archivo real (google-services.json) está en .gitignore por
// contener credenciales, así que EAS Build nunca lo sube (solo empaqueta
// archivos rastreados por git). La variable de entorno de tipo "file"
// GOOGLE_SERVICES_JSON (configurada en EAS → Environment Variables, entorno
// "preview") resuelve a una ruta local en el build runner con ese mismo
// contenido — la usamos si está presente; si no (dev local), cae al archivo
// físico que ya referencia app.json.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
  },
});
