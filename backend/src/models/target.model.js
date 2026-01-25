module.exports = (sequelize, DataTypes) => {
  const Target = sequelize.define(
    "Target",
    {
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },

      metricType: {
        type: DataTypes.ENUM("units", "minutes", "pages", "tasks"),
        allowNull: false,
        defaultValue: "units",
      },

      totalValue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      startDate: { type: DataTypes.DATEONLY, allowNull: true },
      deadlineDate: { type: DataTypes.DATEONLY, allowNull: true },

      status: {
        type: DataTypes.ENUM("active", "paused", "done", "archived"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      indexes: [{ fields: ["userId", "status"] }],
    }
  );

  Target.associate = (models) => {
    Target.belongsTo(models.User, { foreignKey: "userId" });

    Target.hasMany(models.TargetPlan, { foreignKey: "targetId", as: "plans" });
    Target.hasMany(models.PlanItem, { foreignKey: "targetId", as: "planItems" });
    Target.hasMany(models.Checkin, { foreignKey: "targetId", as: "checkins" });
  };

  return Target;
};
