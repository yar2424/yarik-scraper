import { logRunStart, logRunEnd } from "../progressLogger";

import { instantiateConfig } from "../config";

test("test end", async () => {
  await instantiateConfig();
  await logRunEnd();
});
