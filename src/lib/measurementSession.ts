// Memory-only consent state. Never persist an epoch or replay across accounts.
let epoch: string | null = null;
let privateMode = true;
export function setMeasurementEpoch(value: string | null) { epoch = value; }
export function setMeasurementPrivate(value: boolean) { privateMode = value; }
export function measurementEpoch() { return privateMode ? null : epoch; }
