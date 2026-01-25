module.exports = (sequelize, DataTypes) => {
  const PlanItem = sequelize.define(
    "PlanItem",
    {
      date: { type: DataTypes.DATEONLY, allowNull: false },

      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },

      expectedValue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      doneValue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      dueTime: { type: DataTypes.TIME, allowNull: true },

      status: {
        type: DataTypes.ENUM("pending", "done", "skipped"),
        allowNull: false,
        defaultValue: "pending",
      },

      orderIndex: { type: DataTypes.INTEGER, allowNull: true },

      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [
        { fields: ["targetId", "date"] },
        { fields: ["date"] },
      ],
    }
  );

  PlanItem.associate = (models) => {
    PlanItem.belongsTo(models.Target, { foreignKey: "targetId" });
    PlanItem.hasMany(models.Notification, { foreignKey: "planItemId" });
  };

  return PlanItem;
};
