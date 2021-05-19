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
      const context: Xrm.GlobalContext =
        typeof GetGlobalContext !== 'undefined' ? GetGlobalContext() : Xrm.Utility.getGlobalContext();
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

/**
 * Parse GUID by removing curly braces and converting to uppercase
 * @param id GUID to parse
 */
export function parseGuid(id: string): string {
  if (id === null || id === 'undefined' || id === '') {
    return '';
  }

  id = id.replace(/[{}]/g, '');

  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return id.toUpperCase();
  } else {
    throw Error(`Id ${id} is not a valid GUID`);
  }
}

/**
 * Check if two GUIDs are equal
 * @param id1 GUID 1
 * @param id2 GUID 2
 */
export function areGuidsEqual(id1: string, id2: string): boolean {
  try {
    id1 = parseGuid(id1);
    id2 = parseGuid(id2);

    if (id1 === null || id2 === null || id1 === undefined || id2 === undefined || id1 === '' || id2 === '') {
      return false;
    }

    return id1.toLowerCase() === id2.toLowerCase();
  } catch (ex) {
    return false;
  }
}

export interface QueryOptions {
  maxPageSize?: number;
  impersonateUserId?: string;
  representation?: boolean;
}

export interface Entity {
  [propName: string]: unknown;
}

export interface RetrieveMultipleResponse {
  value: Entity[];
  '@odata.nextlink': string;
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
