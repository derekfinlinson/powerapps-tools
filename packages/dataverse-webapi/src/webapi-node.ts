import { request } from 'https';
import url from 'url';
import {
  ChangeSet, Entity, FunctionInput, QueryOptions,
  RetrieveMultipleResponse, WebApiConfig, WebApiRequestConfig, WebApiRequestResult
} from './models';
import * as webApi from './webapi';

type RequestCallback = (result: WebApiRequestResult) => void;

function submitRequest(requestConfig: WebApiRequestConfig, callback: RequestCallback): void {
  const apiUrl = new url.URL(`${requestConfig.apiConfig.url}/${requestConfig.queryString}`);

  const headers = webApi.getHeaders(requestConfig);

  const options = {
    hostname: apiUrl.hostname,
    path: `${apiUrl.pathname}${apiUrl.search}`,
    method: requestConfig.method,
    headers: headers
  };

  if (requestConfig.body) {
    options.headers['Content-Length'] = requestConfig.body.length.toString();
  }

  const req = request(options,
    (result) => {
      let body = '';

      result.setEncoding('utf8');

      result.on('data', (chunk: string | Buffer) => {
        body += chunk;
      });

      result.on('end', () => {
        if ((result.statusCode || 0 >= 200) && (result.statusCode || 0 < 300)) {
          callback({ error: false, response: body, headers: result.headers });
        } else {
          callback({ error: true, response: body, headers: result.headers });
        }
      });
    }
  );

  req.on('error', (error: any) => {
    callback({ error: true, response: error });
  });

  if (requestConfig.body != null) {
    req.write(requestConfig.body);
  }

  req.end();
}

/**
 * Retrieve a record from CRM
 * @param apiConfig WebApiConfig object
 * @param entityType Type of entity to retrieve
 * @param id Id of record to retrieve
 * @param queryString OData query string parameters
 * @param queryOptions Various query options for the query
 */
export function retrieve(apiConfig: WebApiConfig, entitySet: string, id: string, queryString?: string, queryOptions?: QueryOptions): Promise<Entity> {
  return webApi.retrieve(apiConfig, entitySet, id, submitRequest, queryString, queryOptions);
}

/**
 * Retrieve multiple records from CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to retrieve
 * @param queryString OData query string parameters
 * @param queryOptions Various query options for the query
 */
export function retrieveMultiple(apiConfig: WebApiConfig, entitySet: string, queryString?: string, queryOptions?: QueryOptions): Promise<RetrieveMultipleResponse> {
  return webApi.retrieveMultiple(apiConfig, entitySet, submitRequest, queryString, queryOptions);
}

/**
 * Retrieve next page from a retrieveMultiple request
 * @param apiConfig WebApiConfig object
 * @param url Query from the @odata.nextlink property of a retrieveMultiple
 * @param queryOptions Various query options for the query
 */
export function retrieveMultipleNextPage(apiConfig: WebApiConfig, queryUrl: string,
  queryOptions?: QueryOptions): Promise<RetrieveMultipleResponse> {
  return webApi.retrieveMultipleNextPage(apiConfig, queryUrl, submitRequest, queryOptions);
}

/**
 * Create a record in CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to create
 * @param entity Entity to create
 * @param queryOptions Various query options for the query
 */
export function create(apiConfig: WebApiConfig, entitySet: string, entity: Entity, queryOptions?: QueryOptions): Promise<void> {
  return webApi.create(apiConfig, entitySet, entity, submitRequest, queryOptions);
}

/**
 * Create a record in CRM and return data
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to create
 * @param entity Entity to create
 * @param select Select odata query parameter
 * @param queryOptions Various query options for the query
 */
export function createWithReturnData(apiConfig: WebApiConfig, entitySet: string, entity: Entity, select: string, queryOptions?: QueryOptions): Promise<Entity> {
  return webApi.createWithReturnData(apiConfig, entitySet, entity, select, submitRequest, queryOptions);
}

/**
 * Update a record in CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to update
 * @param id Id of record to update
 * @param entity Entity fields to update
 * @param queryOptions Various query options for the query
 */
export function update(apiConfig: WebApiConfig, entitySet: string, id: string, entity: Entity, queryOptions?: QueryOptions): Promise<void> {
  return webApi.update(apiConfig, entitySet, id, entity, submitRequest, queryOptions);
}

/**
 * Create a record in CRM and return data
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to create
 * @param id Id of record to update
 * @param entity Entity fields to update
 * @param select Select odata query parameter
 * @param queryOptions Various query options for the query
 */
export function updateWithReturnData(apiConfig: WebApiConfig, entitySet: string, id: string, entity: Entity, select: string, queryOptions?: QueryOptions): Promise<Entity> {
  return webApi.updateWithReturnData(apiConfig, entitySet, id, entity, select, submitRequest, queryOptions);
}

/**
 * Update a single property of a record in CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to update
 * @param id Id of record to update
 * @param attribute Attribute to update
 * @param queryOptions Various query options for the query
 */
export function updateProperty(apiConfig: WebApiConfig, entitySet: string, id: string, attribute: string, value: string | number | boolean , queryOptions?: QueryOptions): Promise<void> {
  return webApi.updateProperty(apiConfig, entitySet, id, attribute, value, submitRequest, queryOptions);
}

/**
 * Delete a record from CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to delete
 * @param id Id of record to delete
 */
export function deleteRecord(apiConfig: WebApiConfig, entitySet: string, id: string): Promise<void> {
  return webApi.deleteRecord(apiConfig, entitySet, id, submitRequest);
}

/**
 * Delete a property from a record in CRM. Non navigation properties only
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to update
 * @param id Id of record to update
 * @param attribute Attribute to delete
 */
export function deleteProperty(apiConfig: WebApiConfig, entitySet: string, id: string, attribute: string): Promise<void> {
  return webApi.deleteProperty(apiConfig, entitySet, id, attribute, submitRequest);
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
export function associate(apiConfig: WebApiConfig, entitySet: string, id: string, relationship: string,
  relatedEntitySet: string, relatedEntityId: string, queryOptions?: QueryOptions): Promise<void> {
  return webApi.associate(apiConfig, entitySet, id, relationship,
    relatedEntitySet, relatedEntityId, submitRequest, queryOptions);
}

/**
 * Disassociate two records
 * @param apiConfig WebApiConfig obje
 * @param entitySet Type of entity for primary record
 * @param id  Id of primary record
 * @param property Schema name of property or relationship
 * @param relatedEntityId Id of secondary record. Only needed for collection-valued navigation properties
 */
export function disassociate(apiConfig: WebApiConfig, entitySet: string, id: string, property: string,
  relatedEntityId?: string): Promise<void> {
  return webApi.disassociate(apiConfig, entitySet, id, property, submitRequest, relatedEntityId);
}

/**
 * Execute a default or custom bound action in CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to run the action against
 * @param id Id of record to run the action against
 * @param actionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function boundAction(apiConfig: WebApiConfig, entitySet: string, id: string, actionName: string, inputs?: Record<string, unknown>, queryOptions?: QueryOptions): Promise<unknown> {
  return webApi.boundAction(apiConfig, entitySet, id, actionName, submitRequest, inputs, queryOptions);
}

/**
 * Execute a default or custom unbound action in CRM
 * @param apiConfig WebApiConfig object
 * @param actionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function unboundAction(apiConfig: WebApiConfig, actionName: string, inputs?: Record<string, unknown>, queryOptions?: QueryOptions): Promise<unknown> {
  return webApi.unboundAction(apiConfig, actionName, submitRequest, inputs, queryOptions);
}

/**
 * Execute a default or custom bound action in CRM
 * @param apiConfig WebApiConfig object
 * @param entitySet Type of entity to run the action against
 * @param id Id of record to run the action against
 * @param functionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function boundFunction(apiConfig: WebApiConfig, entitySet: string, id: string, functionName: string, inputs?: FunctionInput[], queryOptions?: QueryOptions): Promise<unknown> {
  return webApi.boundFunction(apiConfig, entitySet, id, functionName, submitRequest, inputs, queryOptions);
}

/**
 * Execute an unbound function in CRM
 * @param apiConfig WebApiConfig object
 * @param functionName Name of the action to run
 * @param inputs Any inputs required by the action
 * @param queryOptions Various query options for the query
 */
export function unboundFunction(apiConfig: WebApiConfig, functionName: string, inputs?: FunctionInput[], queryOptions?: QueryOptions): Promise<unknown> {
  return webApi.unboundFunction(apiConfig, functionName, submitRequest, inputs, queryOptions);
}

/**
 * Execute a batch operation in CRM
 * @param apiConfig WebApiConfig object
 * @param batchId Unique batch id for the operation
 * @param changeSetId Unique change set id for any changesets in the operation
 * @param changeSets Array of change sets (create or update) for the operation
 * @param batchGets Array of get requests for the operation
 * @param queryOptions Various query options for the query
 */
export function batchOperation(apiConfig: WebApiConfig, batchId: string, changeSetId: string, changeSets: ChangeSet[], batchGets: string[], queryOptions?: QueryOptions): Promise<unknown> {
  return webApi.batchOperation(apiConfig, batchId, changeSetId, changeSets, batchGets, submitRequest, queryOptions);
}
