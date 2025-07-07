module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Invoices', 'status', {
      type: Sequelize.ENUM('Payé', 'Non Payé'),
      allowNull: false,
      defaultValue: 'Non Payé',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Invoices', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Invoices_status";');
  },
}; 