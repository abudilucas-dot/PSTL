export function formatTrainingVolume(volumeKg: number) {
  if (volumeKg < 1000) return `${Math.round(volumeKg).toLocaleString('pt-BR')} kg`
  return `${(volumeKg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil kg`
}

export function formatVolumeTooltip(volumeKg: number) {
  return `${formatTrainingVolume(volumeKg)} (${Math.round(volumeKg).toLocaleString('pt-BR')} kg)`
}
