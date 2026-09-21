import { handleQuiz } from "../../src/server/apiRouter";
import { createEndpoint } from "../_createHandler";

export default createEndpoint(handleQuiz);
