import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** The mock server's browser entry. Only ever loaded through ./start (dynamic import). */
export const worker = setupWorker(...handlers);
