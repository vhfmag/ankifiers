declare module "make-fetch-happen" {
  import { Request, RequestInit as RawRequestInit, Response } from "node-fetch";

  export * from "node-fetch";

  export type CacheType =
    | "default"
    | "no-store"
    | "reload"
    | "no-cache"
    | "force-cache"
    | "only-if-cache";

  export type RequestInit = RawRequestInit & {
    cacheManager?: string;
    cache?: CacheType;
    proxy?: string;
    noProxy?: string[] | string;
    // ca?: ,
    // cert?: ,
    // key?: ,
    // strictSSL?: ,
    localAddress?: string;
    maxSockets?: number;
    retry?:
      | false
      | number
      | Partial<{
          retries: number | false;
          // factor: ,
          minTimeout: number;
          maxTimeout: number;
          randomize: boolean;
        }>;
    onRetry?: () => void;
    integrity?: string;
  };

  type Fetch = (url: string | Request, init?: RequestInit) => Promise<Response>;

  const fetch: Fetch & { defaults(init: RequestInit): Fetch };
  export default fetch;
}

declare module "anki-apkg-export" {
  export default class AnkiExport {
    constructor(name: string);
    public addMedia(name: string, content: Buffer): void;
    public addCard(
      front: string,
      back: string,
      options?: { tags: string[] },
    ): void;
    public save(): Promise<Buffer>;
  }
}

declare type Promised<T extends Promise<any>> = T extends Promise<infer V>
  ? V
  : never;
