import { type Request, type Response } from "express";
import z from "zod";
import { ResponseCodes } from "../types/codes.js";
import type {
  ChannelAccessConfig,
  OrganizationAccessConfig,
} from "../types/access-config.js";

class HttpRequest {
  body: Request["body"];
  query: Request["query"];
  params: Request["params"];
  header: Request["header"];
  accessConfig:
    | {
        channel: ChannelAccessConfig | {};
        organization: OrganizationAccessConfig | {};
      }
    | undefined;
  ctx: Response["ctx"] | undefined;

  constructor(req: Request, res: Response) {
    this.body = req.body;
    this.query = req.query;
    this.params = req.params;
    this.header = req.header;
    this.accessConfig = res.accessConfig!;
    this.ctx = res.ctx;
  }
}

export class HttpResponse {
  code: number;
  message: string;
  result?: any;
  constructor({
    code,
    message,
    result,
  }: {
    code: number;
    message: string;
    result?: any;
  }) {
    this.code = code;
    this.message = message;
    if (result) {
      this.result = result;
    }
  }
}

export function AsyncHttpHandler(
  fn: (args?: any) => Promise<HttpResponse>,
  schema?: z.ZodObject,
) {
  return async (req: Request, res: Response) => {
    let result: HttpResponse;
    try {
      const httpRequest = new HttpRequest(req, res);
      if (schema) {
        const validHttpReq = schema.safeParse(httpRequest);
        if (!validHttpReq.success) {
          res.status(ResponseCodes.UNPROCESSABLE_ENTITY).json({
            ...new HttpResponse({
              code: ResponseCodes.UNPROCESSABLE_ENTITY,
              message: "Please send Valid data",
            }),
          });
          return;
        }
        
        result = await fn(validHttpReq.data);
      } else {
        result = await fn();
      }
      res.status(result.code).json(result);
    } catch (error: any) {
      throw error;
    }
  };
}
