import {
  BatchResponse,
  ChangeSet,
  Entity,
  FunctionInput,
  QueryOptions,
  RetrieveMultipleResponse,
  WebApiConfig,
  WebApiRequestConfig,
  WebApiRequestResult
} from './models';

type RequestCallback = (config: WebApiRequestConfig, callback: (result: WebApiRequestResult) => void) => void;

function parseGuid(id: string): string {
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

function parseBatchResponse(responseBody: string): BatchResponse[] {
  if (responseBody == null) return [];

  const results: BatchResponse[] = [];
  const boundaryIdentifier = responseBody.substring(0, responseBody.indexOf('\r\n'));
  const responses = responseBody
    .split(boundaryIdentifier)
    .map((r) => r.trim())
    .filter((b) => b.length != 0 && b != '--');

  for (let i = 0; i < responses.length; i++) {
    const changesetResponseIndex = responses[i].indexOf('--changesetresponse');
    if (changesetResponseIndex > -1) {
      parseBatchResponse(responses[i].substring(changesetResponseIndex)).map((r) => results.push(r));
    } else {
      const httpStatusMatch = /HTTP\/[^\s]*\s+(\d{3})\s+([\w\s]*)/i.exec(responses[i]);
      if (httpStatusMatch) {
        const response: BatchResponse = {};
        response.httpStatus = parseInt(httpStatusMatch[1]);
        response.httpStatusText = httpStatusMatch[2]?.split(`\r\n`).join(' ');

        if (response.httpStatus == 200) {
          const dataStartIndex = responses[i].indexOf('{');
          const dataLastIndex = responses[i].lastIndexOf('}');
          if (dataStartIndex > -1 && dataLastIndex > -1) {
            response.data = JSON.parse(responses[i].substr(dataStartIndex, dataLastIndex + 1));
          }
        } else {
          const contentIdMatch = /Content-ID\:\s*([\w\d]*)/i.exec(responses[i]);
          if (contentIdMatch) {
            response.contentId = contentIdMatch[1];
          }

          if (response.httpStatus < 400) {
            const locationMatch = /Location\:\s*(.*)/i.exec(responses[i]);
            if (locationMatch) {
              response.location = locationMatch[1];
            }

            const entityIdMatch = /OData-EntityId\:\s*(.*)/i.exec(responses[i]);
            if (entityIdMatch) {
              const guidMatch = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/.exec(entityIdMatch[1]);
              if (guidMatch) {
                response.entityId = guidMatch[0];
              }
            }
          }

          if (response.httpStatus >= 400) {
            const errorStartIndex = responses[i].indexOf('{');
            const errorLastIndex = responses[i].lastIndexOf('}');
            if (errorStartIndex > -1 && errorLastIndex > -1) {
              response.error = JSON.parse(responses[i].substr(errorStartIndex, errorLastIndex + 1));
            }
          }
        }

        results.push(response);
      }
    }
  }

  return results;
}

export function getHeaders(config: WebApiRequestConfig): Record<string, string> {
  let headers: Record<string, string> = {};

  headers.Accept = 'application/json';
  headers['OData-MaxVersion'] = '4.0';
  headers['OData-Version'] = '4.0';
  headers['Content-Type'] = config.contentType;
  headers['If-None-Match'] = 'null';

  if (config.apiConfig.accessToken != null) {
    headers.Authorization = `Bearer ${config.apiConfig.accessToken}`;
  }

  headers.Prefer = getPreferHeader(config.queryOptions);

  if (config.queryOptions != null && typeof config.queryOptions !== 'undefined') {
    if (config.queryOptions.impersonateUserId != null) {
      headers.CallerObjectId = config.queryOptions.impersonateUserId;
    }

    if (config.queryOptions.customHeaders != null) {
      headers = { ...headers, ...config.queryOptions.customHeaders };
    }
  }

  return headers;
}

function getPreferHeader(queryOptions?: QueryOptions): string {
  const prefer: string[] = ['odata.include-annotations="*"'];

  // add max page size to prefer request header
  if (queryOptions?.maxPageSize) {
    prefer.push(`odata.maxpagesize=${queryOptions.maxPageSize}`);
  }

  // add formatted values to prefer request header
  if (queryOptions?.representation) {
    prefer.push('return=representation');
  }

  return prefer.join(',');
}

function getFunctionInputs(queryString: string, inputs?: FunctionInput[]): string {
  if (inputs == null) {
    return queryString + ')';
  }

  const aliases: string[] = [];

  for (const input of inputs) {
    queryString += input.name;

    if (input.alias) {
      queryString += `=@${input.alias},`;
      aliases.push(`@${input.alias}=${input.value}`);
    } else {
      queryString += `=${input.value},`;
    }
  }

  queryString = queryString.substr(0, queryString.length - 1) + ')';

  if (aliases.length > 0) {
    queryString += `?${aliases.join('&')}`;
  }

  return queryString;
}

function handleError(result: string): unknown {
  try {
    return JSON.parse(result).error;
  } catch (e) {
    return new Error('Unexpected Error');
  }
}
/**
 * Retrieve a record from Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to retrieve
 * @param id Id of record to retrieve
 * @param queryString OData query string parameters
 * @param queryOptions Various query options for the query
 */
export function retrieve(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  submitRequest: RequestCallback,
  queryString?: string,
  queryOptions?: QueryOptions
): Promise<Entity> {
  id = parseGuid(id);
  return retrieveByKey(apiConfig, entitySet, id, submitRequest, queryString, queryOptions);
}
/**
 * Retrieve a record from Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to retrieve
 * @param id Id of record to retrieve
 * @param queryString OData query string parameters
 * @param queryOptions Various query options for the query
 */
export function retrieveByKey(
  apiConfig: WebApiConfig,
  entitySet: string,
  key: string,
  submitRequest: RequestCallback,
  queryString?: string,
  queryOptions?: QueryOptions
): Promise<Entity> {
  if (queryString != null && !/^[?]/.test(queryString)) {
    queryString = `?${queryString}`;
  }


  const query: string = queryString != null ? `${entitySet}(${key})${queryString}` : `${entitySet}(${key})`;

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: query,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Retrieve a single property of a record from Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to retrieve
 * @param id Id of record to retrieve
 * @param property Property to retrieve
 */
export function retrieveProperty(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  submitRequest: RequestCallback,
  property: string
): Promise<Entity> {
  id = parseGuid(id);

  const query = `${entitySet}(${id})/${property}`;

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: query,
    apiConfig: apiConfig,
    queryOptions: {}
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Retrieve columns for a related navigation property of a record from Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to retrieve
 * @param id Id of record to retrieve
 * @param property Navigation property to retrieve
 * @param queryString OData query string parameters
 * @param queryOptions Various query options for the query
 */
export function retrieveNavigationProperties(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  submitRequest: RequestCallback,
  property: string,
  queryString?: string,
  queryOptions?: QueryOptions
): Promise<Entity> {
  id = parseGuid(id);

  if (queryString != null && !/^[?]/.test(queryString)) {
    queryString = `?${queryString}`;
  }

  const query: string = queryString != null ? `${entitySet}(${id})/${property}${queryString}` : `${entitySet}(${id})/${property}`;

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: query,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Retrieve multiple records from Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to retrieve
 * @param queryString OData query string parameters
 * @param queryOptions Various query options for the query
 */
export function retrieveMultiple(
  apiConfig: WebApiConfig,
  entitySet: string,
  submitRequest: RequestCallback,
  queryString?: string,
  queryOptions?: QueryOptions
): Promise<RetrieveMultipleResponse> {
  if (queryString != null && !/^[?]/.test(queryString)) {
    queryString = `?${queryString}`;
  }

  const query: string = queryString != null ? entitySet + queryString : entitySet;

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: query,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Retrieve next page from a retrieveMultiple request
 * @param apiConfig WebApiConfig object
 * @param url Query from the @odata.nextlink property of a retrieveMultiple
 * @param queryOptions Various query options for the query
 */
export function retrieveMultipleNextPage(
  apiConfig: WebApiConfig,
  url: string,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<RetrieveMultipleResponse> {
  apiConfig.url = url;

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: '',
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Create a record in Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to create
 * @param entity Entity to create
 * @param queryOptions Various query options for the query
 */
export function create(
  apiConfig: WebApiConfig,
  entitySet: string,
  entity: Entity,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<void> {
  const config = {
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
    queryString: entitySet,
    body: JSON.stringify(entity),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Create a record in Dataverse and return data
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to create
 * @param entity Entity to create
 * @param select Select odata query parameter
 * @param queryOptions Various query options for the query
 */
export function createWithReturnData(
  apiConfig: WebApiConfig,
  entitySet: string,
  entity: Entity,
  select: string,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<Entity> {
  if (select != null && !/^[?]/.test(select)) {
    select = `?${select}`;
  }

  // set representation
  if (queryOptions == null) {
    queryOptions = {};
  }

  queryOptions.representation = true;

  const config = {
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
    queryString: entitySet + select,
    body: JSON.stringify(entity),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Update a record in Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to update
 * @param id Id of record to update
 * @param entity Entity fields to update
 * @param queryOptions Various query options for the query
 */
export function update(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  entity: Entity,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<void> {
  id = parseGuid(id);

  const config = {
    method: 'PATCH',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})`,
    body: JSON.stringify(entity),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Create a record in Dataverse and return data
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to create
 * @param id Id of record to update
 * @param entity Entity fields to update
 * @param select Select odata query parameter
 * @param queryOptions Various query options for the query
 */
export function updateWithReturnData(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  entity: Entity,
  select: string,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<Entity> {
  id = parseGuid(id);

  if (select != null && !/^[?]/.test(select)) {
    select = `?${select}`;
  }

  // set representation
  if (queryOptions == null) {
    queryOptions = {};
  }

  queryOptions.representation = true;

  const config = {
    method: 'PATCH',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})${select}`,
    body: JSON.stringify(entity),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve(JSON.parse(result.response));
      }
    });
  });
}

/**
 * Update a single property of a record in Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to update
 * @param id Id of record to update
 * @param attribute Attribute to update
 * @param queryOptions Various query options for the query
 */
export function updateProperty(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  attribute: string,
  value: string | number | boolean,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<void> {
  id = parseGuid(id);

  const config = {
    method: 'PUT',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})/${attribute}`,
    body: JSON.stringify({ value: value }),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Delete a record from Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to delete
 * @param id Id of record to delete
 */
export function deleteRecord(apiConfig: WebApiConfig, entitySet: string, id: string, submitRequest: RequestCallback): Promise<void> {
  id = parseGuid(id);

  const config = {
    method: 'DELETE',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})`,
    apiConfig: apiConfig
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Delete a property from a record in Dataverse. Non navigation properties only
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to update
 * @param id Id of record to update
 * @param attribute Attribute to delete
 */
export function deleteProperty(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  attribute: string,
  submitRequest: RequestCallback
): Promise<void> {
  id = parseGuid(id);

  const queryString = `/${attribute}`;

  const config = {
    method: 'DELETE',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})${queryString}`,
    apiConfig: apiConfig
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Associate two records
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity for primary record
 * @param id Id of primary record
 * @param relationship Schema name of relationship
 * @param relatedEntitySet Type of entity for secondary record
 * @param relatedEntityId Id of secondary record
 * @param queryOptions Various query options for the query
 */
export function associate(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  relationship: string,
  relatedEntitySet: string,
  relatedEntityId: string,
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<void> {
  id = parseGuid(id);

  const related = {
    '@odata.id': `${apiConfig.url}/${relatedEntitySet}(${relatedEntityId})`
  };

  const config = {
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})/${relationship}/$ref`,
    body: JSON.stringify(related),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Disassociate two records
 * @param apiConfig WebApiConfig obje
 * @param entitySet Type of entity for primary record
 * @param id  Id of primary record
 * @param property Schema name of property or relationship
 * @param relatedEntityId Id of secondary record. Only needed for collection-valued navigation properties
 */
export function disassociate(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  property: string,
  submitRequest: RequestCallback,
  relatedEntityId?: string
): Promise<void> {
  id = parseGuid(id);

  let queryString: string = property;

  if (relatedEntityId != null) {
    queryString += `(${relatedEntityId})`;
  }

  queryString += '/$ref';

  const config = {
    method: 'DELETE',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})/${queryString}`,
    apiConfig: apiConfig
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Execute a default or custom bound action in Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to run the action against
 * @param id Id of record to run the action against
 * @param actionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function boundAction<T>(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  actionName: string,
  submitRequest: RequestCallback,
  inputs?: Record<string, unknown>,
  queryOptions?: QueryOptions
): Promise<T | null> {
  id = parseGuid(id);

  const config: WebApiRequestConfig = {
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
    queryString: `${entitySet}(${id})/Microsoft.Dynamics.CRM.${actionName}`,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  if (inputs != null) {
    config.body = JSON.stringify(inputs);
  }

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        if (result.response) {
          resolve(JSON.parse(result.response));
        } else {
          resolve(null);
        }
      }
    });
  });
}

/**
 * Execute a default or custom unbound action in Dataverse
 * @param apiConfig WebApiConfig object
 * @param actionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function unboundAction<T>(
  apiConfig: WebApiConfig,
  actionName: string,
  submitRequest: RequestCallback,
  inputs?: Record<string, unknown>,
  queryOptions?: QueryOptions
): Promise<T | null> {
  const config: WebApiRequestConfig = {
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
    queryString: actionName,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  if (inputs != null) {
    config.body = JSON.stringify(inputs);
  }

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        if (result.response) {
          resolve(JSON.parse(result.response));
        } else {
          resolve(null);
        }
      }
    });
  });
}

/**
 * Execute a default or custom bound action in Dataverse
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to run the action against
 * @param id Id of record to run the action against
 * @param functionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function boundFunction<T>(
  apiConfig: WebApiConfig,
  entitySet: string,
  id: string,
  functionName: string,
  submitRequest: RequestCallback,
  inputs?: FunctionInput[],
  queryOptions?: QueryOptions
): Promise<T | null> {
  id = parseGuid(id);

  let queryString = `${entitySet}(${id})/Microsoft.Dynamics.CRM.${functionName}(`;

  queryString = getFunctionInputs(queryString, inputs);

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: queryString,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        if (result.response) {
          resolve(JSON.parse(result.response));
        } else {
          resolve(null);
        }
      }
    });
  });
}

/**
 * Execute an unbound function in Dataverse
 * @param apiConfig WebApiConfig object
 * @param functionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function unboundFunction<T>(
  apiConfig: WebApiConfig,
  functionName: string,
  submitRequest: RequestCallback,
  inputs?: FunctionInput[],
  queryOptions?: QueryOptions
): Promise<T | null> {
  let queryString = `${functionName}(`;

  queryString = getFunctionInputs(queryString, inputs);

  const config = {
    method: 'GET',
    contentType: 'application/json; charset=utf-8',
    queryString: queryString,
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        reject(handleError(result.response));
      } else {
        if (result.response) {
          resolve(JSON.parse(result.response));
        } else {
          resolve(null);
        }
      }
    });
  });
}

/**
 * Execute a batch operation in Dataverse
 * @param apiConfig WebApiConfig object
 * @param batchId Unique batch id for the operation
 * @param changeSetId Unique change set id for any changesets in the operation
 * @param changeSets Array of change sets (create or update) for the operation
 * @param batchGets Array of get requests for the operation
 * @param queryOptions Various query options for the query
 */
export function batchOperation(
  apiConfig: WebApiConfig,
  batchId: string,
  changeSetId: string,
  changeSets: ChangeSet[],
  batchGets: string[],
  submitRequest: RequestCallback,
  queryOptions?: QueryOptions
): Promise<BatchResponse[] | null> {
  // build post body
  const body: string[] = [];

  if (changeSets.length > 0) {
    body.push(`--batch_${batchId}`);
    body.push(`Content-Type: multipart/mixed;boundary=changeset_${changeSetId}`);
    body.push('');
  }

  const relative = `/api/data/v${apiConfig.version}`;

  // push change sets to body
  for (let i = 0; i < changeSets.length; i++) {
    body.push(`--changeset_${changeSetId}`);
    body.push('Content-Type: application/http');
    body.push('Content-Transfer-Encoding:binary');
    body.push(`Content-ID: ${i + 1}`);
    body.push('');
    body.push(`${changeSets[i].method} ${relative}/${changeSets[i].queryString} HTTP/1.1`);
    body.push('Content-Type: application/json;type=entry');
    body.push('');

    body.push(JSON.stringify(changeSets[i].entity));
  }

  if (changeSets.length > 0) {
    body.push(`--changeset_${changeSetId}--`);
    body.push('');
  }

  // push get requests to body
  for (const get of batchGets) {
    body.push(`--batch_${batchId}`);
    body.push('Content-Type: application/http');
    body.push('Content-Transfer-Encoding:binary');
    body.push('');
    body.push(`GET ${relative}/${get} HTTP/1.1`);
    body.push('Accept: application/json');
    body.push('');
  }

  if (batchGets.length > 0) {
    body.push('');
  }

  body.push(`--batch_${batchId}--`);

  const config = {
    method: 'POST',
    contentType: `multipart/mixed;boundary=batch_${batchId}`,
    queryString: '$batch',
    body: body.join('\r\n'),
    apiConfig: apiConfig,
    queryOptions: queryOptions
  };

  return new Promise((resolve, reject) => {
    submitRequest(config, (result: WebApiRequestResult) => {
      if (result.error) {
        const response = parseBatchResponse(result.response);

        reject(response[0].error.error);
      } else {
        if (result.response) {
          const response = parseBatchResponse(result.response);

          resolve(response);
        } else {
          resolve(null);
        }
      }
    });
  });
}
