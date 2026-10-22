import { createApp, buildEmailServices } from "./app";
import { env } from "./config/env";

const app = createApp(buildEmailServices());

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
