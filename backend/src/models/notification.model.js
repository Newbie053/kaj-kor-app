module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      type: {
        type: DataTypes.ENUM("reminder", "behind", "deadline", "streak"),
        allowNull: false,
      },

      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      sentAt: { type: DataTypes.DATE, allowNull: true },

      status: {
        type: DataTypes.ENUM("queued", "sent", "cancelled", "failed"),
        allowNull: false,
        defaultValue: "queued",
      },

      payload: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      indexes: [
        { fields: ["userId", "status", "scheduledAt"] },
        { fields: ["targetId"] },
        { fields: ["planItemId"] },
        { fields: ["dailyTaskId"] },
      ],
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: "userId" });

    Notification.belongsTo(models.Target, { foreignKey: "targetId" });
    Notification.belongsTo(models.PlanItem, { foreignKey: "planItemId" });
    Notification.belongsTo(models.DailyTask, { foreignKey: "dailyTaskId" });
  };

  return Notification;
};
