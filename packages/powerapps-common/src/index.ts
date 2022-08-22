import { generateReport, ReportFormat } from './models/report';

/**
 * Set a field's requirement level
 * @param fieldName Name of field
 * @param requiredLevel Requirement level
 * @param form Form context
 */
export function setFieldRequirementLevel(fieldName: string, requiredLevel: Xrm.Attributes.RequirementLevel, form: Xrm.FormContext): boolean {
  const field = form.getAttribute<Xrm.Attributes.Attribute>(fieldName.toLowerCase());

  if (field == null) {
    return false;
  }

  field.setRequiredLevel(requiredLevel);

  return true;
}

/**
* Set a control's visibility
* @param controlName Name of control
* @param visible Visible
* @param allControls Apply to all controls
* @param form Form context
*/
export function setControlVisibility(controlName: string, allControls: boolean, visible: boolean, form: Xrm.FormContext): boolean {
  const control = form.getControl<Xrm.Controls.StandardControl>(controlName.toLowerCase());

  if (control == null) {
    return false;
  }

  if (allControls) {
    control.getAttribute().controls.forEach(c => {
      (c as Xrm.Controls.StandardControl).setVisible(visible);
    })
  } else {
    control.setVisible(visible);
  }

  return true;
}

/**
* Set a control's label
* @param controlName Name of control
* @param label Label for control
* @param form Form context
*/
export function setControlLabel(controlName: string, label: string, form: Xrm.FormContext): boolean {
  const control = form.getControl<Xrm.Controls.StandardControl>(controlName.toLowerCase());

  if (control == null) {
    return false;
  }

  control.setLabel(label);

  return true;
}

/**
* Set a default value on a field
* @param fieldName Name of field
* @param value Default value
* @param form Form context
* @param fireOnChange Fire field on change event
*/
export function setDefaultValue(fieldName: string, value: string | number | Xrm.LookupValue[] | boolean, form: Xrm.FormContext, fireOnChange?: boolean): boolean {
  const field = form.getAttribute<Xrm.Attributes.Attribute>(fieldName.toLowerCase());

  if (field == null || field.getValue() != null) {
    return false;
  }

  field.setValue(value);

  if (fireOnChange == true) {
    field.fireOnChange();
  }

  return true;
}

/**
* Add a form notification that is cleared after a certain time
* @param message Notification message
* @param level Form notification level
* @param uniqueId Unique Id for the message
* @param timeout Timeout before clearing the notififcation
* @param form Form context
*/
export function addFormNotification(message: string, level: Xrm.Page.ui.FormNotificationLevel,
  uniqueId: string, timeout = 10000, form: Xrm.FormContext): boolean {
  form.ui.setFormNotification(message, level, uniqueId);

  setTimeout(() => {
    form.ui.clearFormNotification(uniqueId);
  }, timeout);

  return true;
}

/**
* Add an on change event to a field
* @param fieldName Name of field
* @param event Event to fire
* @param form Form context
*/
export function addOnChange(fieldName: string, event: Xrm.Events.ContextSensitiveHandler, form: Xrm.FormContext): boolean {
  const field = form.getAttribute<Xrm.Attributes.Attribute>(fieldName.toLowerCase());

  if (field === null || field === undefined) {
    return false;
  }

  // Prevent on change event from being added twice
  field.removeOnChange(event);
  field.addOnChange(event);

  return true;
}

/**
* Remove an on change event from a field
* @param fieldName Name of field 
* @param event Event to fire
* @param form Form context
*/
export function removeOnChange(fieldName: string, event: Xrm.Page.ContextSensitiveHandler, form: Xrm.FormContext): boolean {
  const field = form.getAttribute<Xrm.Attributes.Attribute>(fieldName.toLowerCase());

  if (field === null || field === undefined) {
    return false;
  }

  field.removeOnChange(event);

  return true;
}

/**
* Set a value on a field
* @param fieldName Name of field
* @param value Value
* @param form Form context
* @param fireOnChange Fire field on change event
*/
export function setValue(fieldName: string, value: string | number | Xrm.LookupValue[] | boolean, form: Xrm.FormContext, fireOnChange?: boolean): boolean {
  const field = form.getAttribute<Xrm.Attributes.Attribute>(fieldName.toLowerCase());

  if (field == null) {
    return false;
  }

  // Only set value if it's changed
  if (field.getValue() != value) {
    field.setValue(value);

    if (fireOnChange == true) {
      field.fireOnChange();
    }
  }

  return true;
}

/**
* Check if a field contains data
* @param fieldName Name of field
* @param form Form context
*/
export function fieldContainsData(fieldName: string, form: Xrm.FormContext): boolean {
  const field = form.getAttribute<Xrm.Attributes.Attribute>(fieldName.toLowerCase());

  return field != null && field.getValue() != null;
}

/**
* Disable/enable controls for a field
* @param fieldName Name of control
* @param disabled Disable or enable field
* @param form Form context
*/
export function setDisabled(fieldName: string, allControls: boolean, disabled: boolean, form: Xrm.FormContext): boolean {
  const control = form.getControl<Xrm.Controls.StandardControl>(fieldName.toLowerCase());

  if (control == null) {
    return false;
  }

  if (allControls) {
    control.getAttribute().controls.forEach(c => {
      (c as Xrm.Controls.StandardControl).setDisabled(disabled);
    });
  } else {
    control.setDisabled(disabled);
  }

  return true;
}

/**
* Add presearch event to lookup control
* @param fieldName Name of control
* @param handler Handler for presearch
* @param form Form context
*/
export function addPreSearch(fieldName: string, handler: Xrm.Events.ContextSensitiveHandler, form: Xrm.FormContext): boolean {
  const field = form.getAttribute<Xrm.Attributes.LookupAttribute>(fieldName.toLowerCase());

  if (field == null) {
    return false;
  }

  field.controls.forEach((c: Xrm.Page.LookupControl) => {
    c.addPreSearch(handler);
  });

  return true;
}

/**
 * Navigate to different form
 * @param form Form context
 * @param label Label of form to navigate to
 */
export function navigateToForm(form: Xrm.FormContext, label: string): void {
  const current = form.ui.formSelector.getCurrentItem();

  if (current.getLabel() !== label) {
    form.ui.formSelector.items.forEach(f => {
      if (f.getLabel() === label) {
        f.navigate();
      }
    });
  }
}

/**
 * Filter lookup field
 * @param form Form context
 * @param lookupAttribute Logical name of attribute to which the filter will apply
 * @param attributeFilter Logical name of the attribute to filter on
 * @param values Values for the filter
 */
export function addLookupFilter(form: Xrm.FormContext, lookupAttribute: string, attributeFilter: string, values: string[] | number[] | boolean[]): boolean {
  if (values.length === 0) {
    return false;
  }

  const value = values.map(v => `<value>${v}</value>`);

  const filter = [
    "<filter>",
    `<condition attribute='${attributeFilter}' operator='in'>`,
    value,
    "</condition>",
    "</filter>"
  ].join("");

  form
    .getAttribute<Xrm.Attributes.LookupAttribute>(lookupAttribute)
    .controls.forEach(c => c.addCustomFilter(filter));

  return true;
}

/**
 * Add on save event
 * @param form Form context
 * @param event Event
 */
export function addOnSave(form: Xrm.FormContext, event: Xrm.Events.ContextSensitiveHandler): void {
  // Prevent event from being added twice
  form.data.entity.removeOnSave(event);
  form.data.entity.addOnSave(event);
}

/**
 * Get formatted value from entity
 * @param entity Entity
 * @param field Field
 */
export function getFormattedValue(entity: Record<string, string>, field: string): string {
  return entity[`${field}@OData.Community.Display.V1.FormattedValue`];
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

/**
 * Generate a pre-filtered report
 * @param rowId Row id of record
 * @param reportId Report id
 * @param table Logical table name of record
 * @param format Format for exported report
 * @param reportParameter Report pre filter parameter name
 */
export async function generatePrefilteredReport(rowId: string, reportId: string, table: string, format: ReportFormat, parameterName: string): Promise<string> {
  const config = {
    id: rowId,
    table: table,
    reportId: reportId,
    format: format,
    parameterName: parameterName
  };

  const report = await generateReport(config);

  return report;
}

/**
 * Get environment variable
 * @param variableName Name of environment variable to return
 * @returns Current or default variable value
 */
export async function getEnvironmentVariable(variableName: string): Promise<string | number | boolean | undefined> {
  const fetch = [
    '?fetchXml=',
    '<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">',
    '<entity name="environmentvariabledefinition">',
    '<attribute name="defaultvalue" alias="default" />',
    '<filter type="and">',
    `<condition attribute="schemaname" operator="eq" value="${variableName}" />`,
    '</filter>',
    '<link-entity name="environmentvariablevalue" from="environmentvariabledefinitionid" to="environmentvariabledefinitionid" link-type="outer">',
    '<attribute name="value" alias="current" />',
    '</link-entity>',
    '</entity>',
    '</fetch>'
  ].join('');

  const variables = await Xrm.WebApi.retrieveMultipleRecords('environmentvariabledefinitions', fetch);

  if (variables.entities.length === 0) {
    return;
  }

  const variable = variables.entities[0];

  return variable.current ?? variable.default;
}