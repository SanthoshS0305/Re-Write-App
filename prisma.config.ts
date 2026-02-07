const config = {
  datasource: {
    provider: "postgresql" as const,
    url: process.env.DATABASE_URL || "",
  },
};

export default config;

