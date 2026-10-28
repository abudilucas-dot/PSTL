import { expect, it } from 'vitest'
import { bmi, hasMeasurementValue } from './measurements'
it('calculates BMI only with valid weight and height',()=>{expect(bmi(80,180)).toBe(24.7);expect(bmi(null,180)).toBeNull()})
it('requires at least one body measurement before saving',()=>{expect(hasMeasurementValue('','')).toBe(false);expect(hasMeasurementValue('67','')).toBe(true);expect(hasMeasurementValue('','176')).toBe(true)})
