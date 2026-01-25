module.exports = (sequelize, DataTypes) => {
  const DailyTask = sequelize.define(
    "DailyTask",
    {
      date: { type: DataTypes.DATEONLY, allowNull: false },

      title: { type: DataTypes.STRING, allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true },

      dueTime: { type: DataTypes.TIME, allowNull: true },

      isCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [{ fields: ["userId", "date"] }],
    }
  );

  DailyTask.associate = (models) => {
    DailyTask.belongsTo(models.User, { foreignKey: "userId" });
    DailyTask.hasMany(models.Notification, { foreignKey: "dailyTaskId" });
  };

  return DailyTask;
};
