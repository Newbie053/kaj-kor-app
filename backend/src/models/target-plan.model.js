module.exports = (sequelize, DataTypes) => {
  const TargetPlan = sequelize.define(
    "TargetPlan",
    {
      planType: {
        type: DataTypes.ENUM("daily", "weekly", "custom", "route"),
        allowNull: false,
        defaultValue: "daily",
      },

      dailyTarget: { type: DataTypes.INTEGER, allowNull: true },
      weeklyTarget: { type: DataTypes.INTEGER, allowNull: true },

      // Postgres JSONB is best for [1,2,4,6]
      daysOfWeek: { type: DataTypes.JSONB, allowNull: true },

      defaultDueTime: { type: DataTypes.TIME, allowNull: true },

      startsOn: { type: DataTypes.DATEONLY, allowNull: true },
      endsOn: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      indexes: [{ fields: ["targetId"] }],
    }
  );

  TargetPlan.associate = (models) => {
    TargetPlan.belongsTo(models.Target, { foreignKey: "targetId" });
  };

  return TargetPlan;
};
