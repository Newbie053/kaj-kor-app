module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define('Feedback', {
    message: { type: DataTypes.TEXT, allowNull: false },
    source: { type: DataTypes.STRING, defaultValue: 'mobile' },
  });

  Feedback.associate = (models) => {
    Feedback.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Feedback;
};
