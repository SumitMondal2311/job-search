import prisma from "./config/prisma.js";
import app from "./server.js";

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("🔗 Prisma connected to database");
    console.log(`🚀 Server running on port http://localhost:${PORT}`);
  } catch (error) {
    prisma.$disconnect();
    console.error("Error starting app: " + error);
    process.exit(1);
  }
});
