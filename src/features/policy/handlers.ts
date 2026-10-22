import { session } from '@/features/demo/context';
import { json, failure } from '@/lib/http';
import { body, operation } from '@/lib/request-validation';
import { readPolicy, updatePolicy } from './service';
export async function policyHandler(req: Request) {
  try {
    return await session(
      req,
      async (c) => {
        const data =
          req.method === 'PATCH'
            ? await updatePolicy(c, await body(req), operation(req))
            : await readPolicy(c);
        return json({ data, meta: { generation: c.environment.generation } });
      },
      req.method === 'PATCH' ? 'mutation' : undefined,
    );
  } catch (e) {
    return failure(e);
  }
}
