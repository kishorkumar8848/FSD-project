import { CG001 } from './CG001.js';
import { CG002 } from './CG002.js';
import { CG003 } from './CG003.js';
import { CG004 } from './CG004.js';
import { CG005 } from './CG005.js';
import { CG006 } from './CG006.js';
import { CG007 } from './CG007.js';
import { CG008 } from './CG008.js';
import { CG009 } from './CG009.js';
import { CG010 } from './CG010.js';

export const allRules = [
  CG001,
  CG002,
  CG003,
  CG004,
  CG005,
  CG006,
  CG007,
  CG008,
  CG009,
  CG010,
];

export const rulesMap = new Map(allRules.map((r) => [r.ruleId, r]));

export function getRuleById(ruleId) {
  return rulesMap.get(ruleId) || null;
}
