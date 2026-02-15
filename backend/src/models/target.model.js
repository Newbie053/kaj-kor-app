// backend/src/models/target.model.js
module.exports = (sequelize, DataTypes) => {
  const Target = sequelize.define('Target', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    total: { type: DataTypes.INTEGER, defaultValue: 0 },
    completed: { type: DataTypes.INTEGER, defaultValue: 0 },
    deadline: { type: DataTypes.DATE },
    skillName: { type: DataTypes.STRING },
    totalDays: { type: DataTypes.INTEGER },
    dailyMinutes: { type: DataTypes.INTEGER, defaultValue: 30 },
    currentDay: { type: DataTypes.INTEGER, defaultValue: 1 },
    streak: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastCompleted: { type: DataTypes.DATE },
    dailyLogs: { type: DataTypes.JSON, defaultValue: [] },
    milestones: { type: DataTypes.JSON, defaultValue: [] },
        dayPlans: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });

  Target.associate = (models) => {
    Target.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Target;
};
