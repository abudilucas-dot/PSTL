export function bmi(weightKg:number|null,heightCm:number|null){if(!weightKg||!heightCm||heightCm<=0)return null;return Math.round(weightKg/((heightCm/100)**2)*10)/10}
export function hasMeasurementValue(weight:string,height:string){return Boolean(weight.trim()||height.trim())}
