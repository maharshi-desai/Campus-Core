import express from "express";
import { requireInternalApi } from "./internal-api-auth.js";
import campusRouter from "./routes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api", requireInternalApi, campusRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "Not found." });
});

app.use((error, _request, response, _next) => {
  console.error("CampusCore API request failed:", error);
  response.status(500).json({ message: "The request could not be completed." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`CampusCore API listening on port ${port}`);
});
