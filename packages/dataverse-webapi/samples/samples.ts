/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  associate,
  batchOperation,
  boundAction,
  ChangeSet,
  create,
  createWithReturnData,
  deleteProperty,
  deleteRecord,
  disassociate,
  retrieve,
  retrieveMultiple,
  retrieveMultipleNextPage,
  unboundAction,
  update,
  updateProperty,
  WebApiConfig
} from '../src/index';

const config: WebApiConfig = new WebApiConfig('9.1');

// demonstrate create
const account: any = {
  name: 'Test Account'
};

create(config, 'accounts', account)
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate create with returned odata
createWithReturnData(config, 'accounts', account, '$select=name,accountid')
  .then((created: any) => {
    console.log(created.name);
  });

// demonstrate retrieve
retrieve(config, 'accounts', '00000000-0000-0000-0000-000000000000', '$select=name')
  .then((retrieved: any) => {
    console.log(retrieved.data.name);
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate retrieve multiple
const options = '$filter=name eq \'Test Account\'&$select=name,accountid';

retrieveMultiple(config, 'accounts', options)
  .then(
    (results) => {
      const accounts: any[] = [];
      for (const record of results.value) {
        accounts.push(record);
      }

      // demonstrate getting next page from retreiveMultiple
      retrieveMultipleNextPage(config, results['@odata.nextlink']).then(
        (moreResults) => {
          console.log(moreResults.value.length);
        }
      );

      console.log(accounts.length);
    },
    (error: any) => {
      console.log(error: any);
    }
  );

// demonstrate update. Update returns no content
update(config, 'accounts', '00000000-0000-0000-0000-000000000000', account)
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate update property. Update property returns no content
updateProperty(config, 'accounts', '00000000-0000-0000-0000-000000000000', 'name', 'Updated Account')
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate delete. Delete returns no content
deleteRecord(config, 'accounts', '00000000-0000-0000-0000-000000000000')
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate delete property. Delete property returns no content
deleteProperty(config, 'accounts', '00000000-0000-0000-0000-000000000000', 'address1_line1')
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate delete navigation property. Delete property returns no content
deleteProperty(config, 'accounts', '00000000-0000-0000-0000-000000000000', 'primarycontactid')
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate associate. Associate returns no content
associate(config, 'accounts', '00000000-0000-0000-0000-000000000000',
  'contact_customer_accounts', 'contacts', '00000000-0000-0000-0000-000000000000')
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate disassociate. Disassociate returns no content
disassociate(config, 'accounts', '00000000-0000-0000-0000-000000000000', 'contact_customer_accounts')
  .then(() => {
    // do something
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate bound action
const inputs = {
  NumberInput: 100,
  StringInput: 'Text',
};

boundAction(config, 'accounts', '00000000-0000-0000-0000-000000000000', 'sample_BoundAction', inputs)
  .then((result: any) => {
    console.log(result.annotationid);
  }, (error: any) => {
    console.log(error: any);
  });

unboundAction(config, 'sample_UnboundAction', inputs)
  .then((result: any) => {
    console.log(result.annotationid);
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate bound function
const inputs3 = {
  name: 'Argument',
  value: 'Value',
};

boundAction(config, 'accounts', '00000000-0000-0000-0000-000000000000', 'sample_BoundFunction', inputs3)
  .then((result: any) => {
    console.log(result.annotationid);
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate create. Custom action - Add note to account
const inputs4 = {
  alias: 'tid',
  name: 'Target',
  value: '{\'@odata.id\':\'accounts(87989176-0887-45D1-93DA-4D5F228C10E6)\'}',
};

unboundAction(config, 'sample_UnboundAction', inputs4)
  .then((result: any) => {
    console.log(result.annotationid);
  }, (error: any) => {
    console.log(error: any);
  });

// demonstrate batch operation
const changeSets: ChangeSet[] = [
  {
    entity: {
      name: 'Test 1'
    },
    method: 'POST',
    queryString: 'accounts',
  },
  {
    entity: {
      name: 'Test 2'
    },
    method: 'POST',
    queryString: 'accounts',
  },
];

const gets = [
  'accounts?$select=name',
];

batchOperation(config, 'BATCH123', 'CHANGESET123', changeSets, gets)
  .then((result) => {
    console.log(result);
  }, (error: any) => {
    console.log(error: any);
  });
