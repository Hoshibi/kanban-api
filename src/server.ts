import "dotenv/config";
import { app } from "./app.ts";

const PORT = Number(process.env.PORT ?? 3333);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
