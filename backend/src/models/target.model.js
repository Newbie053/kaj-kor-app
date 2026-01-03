module.exports = (sequelize, DataTypes) => {
  const Target = sequelize.define('Target', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    total: { type: DataTypes.INTEGER, defaultValue: 0 },
    completed: { type: DataTypes.INTEGER, defaultValue: 0 },
    deadline: { type: DataTypes.DATE },
  });

  Target.associate = (models) => {
    Target.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Target;
};
