import { http, HttpResponse, type HttpResponseResolver } from "msw";
import {
  menuItemInputSchema,
  menuItemPatchSchema,
  newOrderSchema,
  orderPatchSchema,
  orderStatusSchema,
  settingsPatchSchema,
} from "@/lib/data/schemas";
import {
  createMenuItem,
  getMenuItem,
  getOrder,
  HttpError,
  listMenu,
  listOrders,
  parseBody,
  patchSettings,
  placeOrder,
  readSettings,
  removeMenuItem,
  setOrderStatus,
  updateMenuItem,
} from "./db";
import { applyNetwork } from "./network";

/**
 * The REST API, answered in the browser. Every route goes through `route()`,
 * which adds the simulated network (latency + failures) and turns HttpErrors
 * into JSON error responses, exactly what a real backend would send.
 *
 *   GET    /api/menu            POST   /api/menu
 *   GET    /api/menu/:id        PATCH  /api/menu/:id        DELETE /api/menu/:id
 *   GET    /api/orders?from=&status=   POST /api/orders (Idempotency-Key header)
 *   GET    /api/orders/:id      PATCH  /api/orders/:id
 *   GET    /api/settings        PATCH  /api/settings
 */
const route =
  (resolver: HttpResponseResolver): HttpResponseResolver =>
  async (info) => {
    const failure = await applyNetwork();
    if (failure) return failure;
    try {
      return await resolver(info);
    } catch (e) {
      if (e instanceof HttpError) {
        return HttpResponse.json({ error: { code: e.code, message: e.message, fields: e.fields } }, { status: e.status });
      }
      console.error("[mock api]", e);
      return HttpResponse.json({ error: { code: "internal_error", message: "Unexpected server error." } }, { status: 500 });
    }
  };

const idOf = (params: Record<string, string | readonly string[] | undefined>) => String(params.id);

export const handlers = [
  // ------------------------------------------------------------- menu
  http.get("/api/menu", route(async () => HttpResponse.json(await listMenu()))),
  http.post(
    "/api/menu",
    route(async ({ request }) => HttpResponse.json(await createMenuItem(await parseBody(request, menuItemInputSchema)), { status: 201 })),
  ),
  http.get("/api/menu/:id", route(async ({ params }) => HttpResponse.json(await getMenuItem(idOf(params))))),
  http.patch(
    "/api/menu/:id",
    route(async ({ params, request }) => HttpResponse.json(await updateMenuItem(idOf(params), await parseBody(request, menuItemPatchSchema)))),
  ),
  http.delete(
    "/api/menu/:id",
    route(async ({ params }) => {
      await removeMenuItem(idOf(params));
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  // ----------------------------------------------------------- orders
  http.get(
    "/api/orders",
    route(async ({ request }) => {
      const url = new URL(request.url);
      const from = url.searchParams.get("from");
      const status = url.searchParams.getAll("status").flatMap((s) => {
        const p = orderStatusSchema.safeParse(s);
        return p.success ? [p.data] : [];
      });
      return HttpResponse.json(await listOrders({ from: from ? Number(from) : undefined, status: status.length ? status : undefined }));
    }),
  ),
  http.post(
    "/api/orders",
    route(async ({ request }) => {
      const { order, created } = await placeOrder(await parseBody(request, newOrderSchema), request.headers.get("Idempotency-Key") ?? undefined);
      return HttpResponse.json(order, { status: created ? 201 : 200 });
    }),
  ),
  http.get("/api/orders/:id", route(async ({ params }) => HttpResponse.json(await getOrder(idOf(params))))),
  http.patch(
    "/api/orders/:id",
    route(async ({ params, request }) => HttpResponse.json(await setOrderStatus(idOf(params), (await parseBody(request, orderPatchSchema)).status))),
  ),

  // --------------------------------------------------------- settings
  http.get("/api/settings", route(async () => HttpResponse.json(await readSettings()))),
  http.patch(
    "/api/settings",
    route(async ({ request }) => HttpResponse.json(await patchSettings(await parseBody(request, settingsPatchSchema)))),
  ),
];
