module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite importar las migraciones .sql de Drizzle como texto dentro de la app.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
