const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require('discord.js')

/**
 * Mapeo de nombres de campos a títulos y estilos de modal.
 * @type {Object<string, {title: string, label: string, style: TextInputStyle}>}
 */
const fieldModalOptions = {
  title: {
    title: 'Título',
    label: 'Nuevo Título',
    style: TextInputStyle.Short
  },
  description: {
    title: 'Descripción',
    label: 'Nueva Descripción',
    style: TextInputStyle.Paragraph
  },
  footer: {
    title: 'Pie de Página',
    label: 'Nuevo Pie de Página',
    style: TextInputStyle.Short
  },
  image: {
    title: 'Imagen',
    label: 'Nueva URL de Imagen',
    style: TextInputStyle.Short
  },
  thumbnail: {
    title: 'Miniatura',
    label: 'Nueva URL de Miniatura',
    style: TextInputStyle.Short
  }
}

/**
 * Función genérica para crear y mostrar un modal de edición de embed.
 * @param {object} interaction La interacción de Discord.
 * @param {string} embedType El tipo de embed ('panel', 'opening', etc.).
 * @param {string} field El campo del embed a editar ('title', 'description', etc.).
 */
async function showEmbedModal(interaction, embedType, field) {
  const options = fieldModalOptions[field]
  if (!options) return // Salir si el campo no es válido

  const modal = new ModalBuilder()
    .setCustomId(`edit-${field}-${embedType}-modal`)
    .setTitle(`Editar ${options.title} del ${embedType}`)

  const textInput = new TextInputBuilder()
    .setCustomId(`${field}Input`)
    .setLabel(options.label)
    .setStyle(options.style)
    .setRequired(true)
    .setPlaceholder(`Ingresa ${options.label.toLowerCase()}`)

  const actionRow = new ActionRowBuilder().addComponents(textInput)
  modal.addComponents(actionRow)

  await interaction.showModal(modal)
}

/**
 * Maneja las interacciones de los botones de edición de embeds de forma genérica.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function handleEmbedButtons(interaction, ticketConfig) {
  const customId = interaction.customId

  // Analizar el customId para extraer el tipo de embed y el campo a editar
  const [action, field, embedType] = customId.split('-')
  // Usamos el campo para determinar la acción
  switch (field) {
    case 'title':
    case 'description':
    case 'footer':
    case 'image':
    case 'thumbnail': // TODO: Trabajar con los images y thumbnail
      await showEmbedModal(interaction, embedType, field)
      break
    case 'color':
      const colorsToDisplay = [
        { name: 'Rojo', value: 'FF0000' },
        { name: 'Verde', value: '00FF00' },
        { name: 'Azul', value: '0000FF' },
        { name: 'Amarillo', value: 'FFFF00' },
        { name: 'Cian', value: '00FFFF' },
        { name: 'Magenta', value: 'FF00FF' },
        { name: 'Blanco', value: 'FFFFFF' },
        { name: 'Negro', value: '000000' },
        { name: 'Gris', value: '808080' },
        { name: 'Naranja', value: 'FFA500' },
        { name: 'Púrpura', value: '800080' },
        { name: 'Rosa', value: 'FFC0CB' },
        { name: 'Marrón', value: 'A52A2A' },
        { name: 'Azul Claro', value: 'ADD8E6' },
        { name: 'Verde Lima', value: '32CD32' },
        { name: 'Turquesa', value: '40E0D0' },
        { name: 'Índigo', value: '4B0082' },
        { name: 'Oro', value: 'FFD700' },
        { name: 'Plata', value: 'C0C0C0' },
        { name: 'Granate', value: '800000' },
        { name: 'Verde Oliva', value: '808000' },
        { name: 'Azul Marino', value: '000080' },
        { name: 'Teal', value: '008080' },
        { name: 'Lavanda', value: 'E6E6FA' },
        { name: 'Carmín', value: '960018' }
      ]

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`embed-color-${embedType}`)
        .setPlaceholder('Selecciona el Color')

      const colorOptions = colorsToDisplay.map((color) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(color.name)
          .setValue(color.value)
      )

      selectMenu.addOptions(colorOptions)
      const selectRow = new ActionRowBuilder().addComponents(selectMenu)

      const colorEmbed = new EmbedBuilder()
        .setTitle('Blue')
        .setTitle('Selección de Color')
        .setDescription(`Selecciona el color del embed de \`${embedType}\``)

      await interaction.editReply({
        embeds: [colorEmbed],
        components: [selectRow]
      })
      break
    case 'fields':
      // TODO: Lógica para gestionar campos (agregar/eliminar)
      break
    default:
      break
  }
}

module.exports = handleEmbedButtons
