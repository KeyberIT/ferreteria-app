const { sequelize, Admin } = require('../models');

async function createAdminUser() {
  try {
    // Sincronizar modelos
    await sequelize.sync();

    // Buscar o crear entrada de administrador
    const [admin, created] = await Admin.findOrCreate({
      where: { username: 'Keyber' },
      defaults: {
        username: 'Keyber',
        password: '1234'
      }
    });

    if (created) {
      console.log('Administrador creado exitosamente');
    } else {
      console.log('Administrador ya existía');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al crear administrador:', error);
    process.exit(1);
  }
}

createAdminUser();
