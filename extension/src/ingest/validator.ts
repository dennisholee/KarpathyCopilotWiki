/**
 * Traceability Validator
 * Ensures generated wiki pages cite source files under `/raw` as required by the constitution.
 */

import { WikiPage } from '../models/types';

export interface TraceResult {
  valid: boolean;
  missingFields: string[];
}

export class TraceabilityValidator {
  static validate(page: WikiPage): TraceResult {
    const missing: string[] = [];

    // Must have links or sourceReferences pointing to /raw
    const sources = (page.sourceReferences || []).concat(page.links || []);

    if (!sources || sources.length === 0) {
      missing.push('sourceReferences or links');
      return { valid: false, missingFields: missing };
    }

    // At least one source should reference /raw/
    const hasRaw = sources.some((s) => String(s).startsWith('/raw/') || String(s).includes('/raw/'));
    if (!hasRaw) {
      missing.push('no /raw/ source referenced');
      return { valid: false, missingFields: missing };
    }

    // Passes basic traceability check
    return { valid: true, missingFields: [] };
  }
}
