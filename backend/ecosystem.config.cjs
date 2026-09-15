module.exports = {
  apps: [
    {
      name: "team-management-api",
      script: "src/server.js",
      instances: "max", // Scale to all available CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
