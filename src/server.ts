import { createApp, buildEmailServices, buildLeadMagnetService } from "./app";
import { env } from "./config/env";

const app = createApp(buildEmailServices(), buildLeadMagnetService());

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
