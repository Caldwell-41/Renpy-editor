import type {LabMount} from '../../contracts.ts';
import {mountArithmetic} from './study.ts';
export const mount:LabMount=(host,context)=>mountArithmetic(host,context,'equation-v1');
