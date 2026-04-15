import { ContractValidationIssue, ContractValidationResult, OpenMetadataModelContract } from '../models/types';

export class ContractValidator {
  validate(contract: OpenMetadataModelContract, rationale: string, evidenceCount: number): ContractValidationResult {
    const issues: ContractValidationIssue[] = [];

    if (!contract.id.trim()) {
      issues.push({ field: 'id', message: 'Contract id is required.', severity: 'error' });
    }

    if (!contract.name.trim()) {
      issues.push({ field: 'name', message: 'Contract name is required.', severity: 'error' });
    }

    if (!contract.displayName.trim()) {
      issues.push({ field: 'displayName', message: 'Display name is required.', severity: 'error' });
    }

    if (!contract.description.trim()) {
      issues.push({ field: 'description', message: 'Contract description is required.', severity: 'error' });
    }

    if (!contract.status.trim()) {
      issues.push({ field: 'status', message: 'Status is required.', severity: 'error' });
    }

    if (!contract.targetEntity?.name.trim()) {
      issues.push({ field: 'targetEntity.name', message: 'Target entity name is required.', severity: 'error' });
    }

    if (!contract.targetEntity?.type.trim()) {
      issues.push({ field: 'targetEntity.type', message: 'Target entity type is required.', severity: 'error' });
    }

    if (!contract.schemaText.trim()) {
      issues.push({ field: 'schemaText', message: 'Schema text is required.', severity: 'error' });
    }

    if (contract.owner) {
      if (!contract.owner.id.trim()) {
        issues.push({ field: 'owner.id', message: 'Owner id is required when owner is present.', severity: 'error' });
      }
      if (!contract.owner.type.trim()) {
        issues.push({ field: 'owner.type', message: 'Owner type is required when owner is present.', severity: 'error' });
      }
    }

    contract.resources.forEach((resource, index) => {
      if (!resource.type.trim()) {
        issues.push({ field: `resources[${index}].type`, message: 'Resource type is required.', severity: 'error' });
      }
      if (!resource.name.trim()) {
        issues.push({ field: `resources[${index}].name`, message: 'Resource name is required.', severity: 'error' });
      }
      if (!resource.description.trim()) {
        issues.push({ field: `resources[${index}].description`, message: 'Resource description is required.', severity: 'error' });
      }
      if (resource.isResolved && resource.sourceReferences.length === 0) {
        issues.push({ field: `resources[${index}].sourceReferences`, message: 'Resolved resources should cite supporting raw sources.', severity: 'warning' });
      }
    });

    if (contract.incidentManagement?.isResolved && contract.incidentManagement.sourceReferences.length === 0) {
      issues.push({ field: 'incidentManagement.sourceReferences', message: 'Resolved incident management details should cite supporting raw sources.', severity: 'warning' });
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