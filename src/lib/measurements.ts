export function bmi(weightKg:number|null,heightCm:number|null){if(!weightKg||!heightCm||heightCm<=0)return null;return Math.round(weightKg/((heightCm/100)**2)*10)/10}
