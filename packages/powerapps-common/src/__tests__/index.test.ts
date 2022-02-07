import * as common from '../index';
import { XrmMockGenerator, StringAttributeMock } from 'xrm-mock';

describe('setFieldRequirementLevel', () => {
  let field: StringAttributeMock;

  beforeAll(() => {
    XrmMockGenerator.initialise();
    field = XrmMockGenerator.Attribute.createString('field');
  });

  it('sets field as required', () => {
    const levelSet = common.setFieldRequirementLevel('field', XrmEnum.AttributeRequirementLevel.Required, XrmMockGenerator.getFormContext());

    expect(levelSet).toBe(true);
    expect(field.getRequiredLevel()).toBe(XrmEnum.AttributeRequirementLevel.Required);
  });

  it('sets field as reccomended', () => {
    const levelSet = common.setFieldRequirementLevel('field', XrmEnum.AttributeRequirementLevel.Recommended, XrmMockGenerator.getFormContext());

    expect(levelSet).toBe(true);
    expect(field.getRequiredLevel()).toBe(XrmEnum.AttributeRequirementLevel.Recommended);
  });

  it('sets field as optional', () => {
    const levelSet = common.setFieldRequirementLevel('field', XrmEnum.AttributeRequirementLevel.None, XrmMockGenerator.getFormContext());

    expect(levelSet).toBe(true);
    expect(field.getRequiredLevel()).toBe(XrmEnum.AttributeRequirementLevel.None);
  });

  it('field not on form', () => {
    const levelSet = common.setFieldRequirementLevel('missing-field', XrmEnum.AttributeRequirementLevel.None, XrmMockGenerator.getFormContext());

    expect(levelSet).toBe(false);
  });
})