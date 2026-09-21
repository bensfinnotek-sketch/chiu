import { handleHealth } from "../src/server/apiRouter";
import { createEndpoint } from "./_createHandler";

export default createEndpoint(handleHealth);
