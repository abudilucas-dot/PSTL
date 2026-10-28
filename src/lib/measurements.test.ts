import { expect, it } from 'vitest'
import { bmi } from './measurements'
it('calculates BMI only with valid weight and height',()=>{expect(bmi(80,180)).toBe(24.7);expect(bmi(null,180)).toBeNull()})
