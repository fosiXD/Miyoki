// Mapas para almacenar los temporizadores activos por Channel ID
const activeReminders = new Map();
const activeCloseTimers = new Map();

// Exporta los mapas para que puedan ser importados en cualquier otro archivo
module.exports = {
  activeReminders,
  activeCloseTimers,
};