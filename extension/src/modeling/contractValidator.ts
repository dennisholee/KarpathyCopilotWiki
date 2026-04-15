import { ContractValidationIssue, ContractValidationResult, OpenMetadataModelContract } from '../models/types';

export class ContractValidator {
  validate(contract: OpenMetadataModelContract, rationale: string, evidenceCount: number): ContractValidationResult {
    const issues: ContractValidationIssue[] = [];

    if (!contract.entityName.trim()) {
      issues.push({ field: 'entityName', message: 'Entity name is required.', severity: 'error' });
    }

    if (!contract.id.trim()) {
      issues.push({ field: 'id', message: 'Contract id is required.', severity: 'error' });
    }

    if (!contract.name.trim()) {
      issues.push({ field: 'name', message: 'Contract name is required.', severity: 'error' });
    }

    if (!contract.displayName.trim()) {
      issues.push({ field: 'displayName', message: 'Display name is required.', severity: 'error' });
    }

    if (!contract.domain.trim()) {
      issues.push({ field: 'domain', message: 'Domain is required.', severity: 'error' });
    }

    if (!contract.sourceModel.trim()) {
      issues.push({ field: 'sourceModel', message: 'Source model is required.', severity: 'error' });
    }

    if (contract.attributes.length === 0) {
      issues.push({ field: 'attributes', message: 'At least one attribute is required.', severity: 'error' });
    }

    contract.attributes.forEach((attribute, index) => {
      if (!attribute.name.trim()) {
        issues.push({ field: `attributes[${index}].name`, message: 'Attribute name is required.', severity: 'error' });
      }
      if (!attribute.dataType.trim()) {
        issues.push({ field: `attributes[${index}].dataType`, message: 'Data type is required.', severity: 'error' });
      }
      if (typeof attribute.required !== 'boolean') {
        issues.push({ field: `attributes[${index}].required`, message: 'Required flag must be provided.', severity: 'error' });
      }
      if (attribute.businessRules.length === 0) {
        issues.push({ field: `attributes[${index}].businessRules`, message: 'Business rules are required.', severity: 'error' });
      }
      if (attribute.validationLogic.length === 0) {
        issues.push({ field: `attributes[${index}].validationLogic`, message: 'Validation logic is required.', severity: 'error' });
      }
      if (attribute.sourceReferences.length === 0) {
        issues.push({ field: `attributes[${index}].sourceReferences`, message: 'Source references should be supplied for traceability.', severity: 'warning' });
      }
    });

    if (!rationale.trim()) {
      issues.push({ field: 'rationale', message: 'Rationale is required.', severity: 'error' });
    }

    if (evidenceCount === 0) {
      issues.push({ field: 'evidence', message: 'At least one evidence reference is required.', severity: 'error' });
    }

    return {
      isValid: issues.every((issue) => issue.severity !== 'error'),
      issues,
    };
  }
}