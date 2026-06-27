import healthRouter from '../../src/routes/health';
import type { Request, Response, NextFunction } from 'express';

type MockRes = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockRes;
  json: (payload: unknown) => MockRes;
  setHeader: (name: string, value: string) => void;
};

function createMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };
  return res;
}

type RouteLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { handle: (req: Request, res: Response, next: NextFunction) => void }[];
  };
};

function getRouteLayer(path: string, method: string): RouteLayer['route'] {
  const layer = healthRouter.stack.find((l) => {
    if (!l.route) return false;
    const r = l.route as unknown as {
      path: string;
      methods: Record<string, boolean>;
    };
    return r.path === path && r.methods[method.toLowerCase()] === true;
  });
  if (!layer || !layer.route) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found on health router`);
  }
  return layer.route as unknown as RouteLayer['route'];
}

function getAllRouteLayer(path: string): RouteLayer['route'] {
  const layer = healthRouter.stack.find((l) => {
    if (!l.route) return false;
    const r = l.route as unknown as {
      path: string;
      methods: Record<string, boolean>;
    };
    return r.path === path && r.methods._all === true;
  });
  if (!layer || !layer.route) {
    throw new Error(`router.all('${path}') not found on health router`);
  }
  return layer.route as unknown as RouteLayer['route'];
}

describe('health router (unit)', () => {
  it('GET / responds with 200 and the expected shape', () => {
    const route = getRouteLayer('/', 'get')!;
    const handlers = route.stack.map((s) => s.handle);
    const handler = handlers[handlers.length - 1];
    const req = {} as Request;
    const res = createMockRes();
    const next = jest.fn() as unknown as NextFunction;

    handler(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(200);
    const body = res.body as { status: string; uptime: number; timestamp: string };
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThan(0);
    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(new Date(body.timestamp).getTime())).toBe(false);
  });

  it('non-GET methods hit the 405 handler with Allow: GET', () => {
    const route = getAllRouteLayer('/')!;
    const handlers = route.stack.map((s) => s.handle);
    const handler = handlers[handlers.length - 1];
    const req = { method: 'POST' } as unknown as Request;
    const res = createMockRes();
    const next = jest.fn() as unknown as NextFunction;

    handler(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET');
  });
});
