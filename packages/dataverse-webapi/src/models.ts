export class WebApiConfig {
  public version: string;
  public accessToken?: string;
  public url?: string;

  /**
   * Constructor
   * @param config WebApiConfig
   */
  constructor(version: string, accessToken?: string, url?: string) {
    // If URL not provided, get it from Xrm.Context
    if (url == null) {
      const context: Xrm.GlobalContext = typeof GetGlobalContext !== 'undefined' ? GetGlobalContext() : Xrm.Utility.getGlobalContext();
      url = `${context.getClientUrl()}/api/data/v${version}`;

      this.url = url;
    } else {
      this.url = `${url}/api/data/v${version}`;
      this.url = this.url.replace('//', '/');
    }

    this.version = version;
    this.accessToken = accessToken;
  }
}

export interface WebApiRequestResult {
  error: boolean;
  response: any;
  headers?: unknown;
}

export interface WebApiRequestConfig {
  method: string;
  contentType: string;
  body?: string;
  queryString: string;
  apiConfig: WebApiConfig;
  queryOptions?: QueryOptions;
}

export interface QueryOptions {
  maxPageSize?: number;
  impersonateUserId?: string;
  representation?: boolean;
  customHeaders?: Record<string, string>;
}

export interface Entity {
  ['@odata.etag']?: string;
  [propName: string]: string | number | boolean | Date | undefined | null | Entity | Entity[];
}

export interface RetrieveMultipleResponse {
  value: Entity[];
  '@odata.nextLink': string;
}
export interface ChangeSet {
  queryString: string;
  entity: Entity;
  method: string;
}

export interface FunctionInput {
  name: string;
  value: string;
  alias?: string;
}

export interface BatchResponse {
  httpStatus?: number;
  httpStatusText?: string;
  contentId?: string;
  data?: any;
  location?: string;
  entityId?: string;
  error?: any;
}
