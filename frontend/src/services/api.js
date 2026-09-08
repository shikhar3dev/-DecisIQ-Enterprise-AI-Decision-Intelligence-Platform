const API_BASE = '/api';

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/kpis`);
  return res.json();
}

export async function fetchRevenueTrends(granularity = 'monthly') {
  const res = await fetch(`${API_BASE}/revenue-trends?granularity=${granularity}`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  return res.json();
}

export async function fetchRegions() {
  const res = await fetch(`${API_BASE}/regions`);
  return res.json();
}

export async function fetchCohorts() {
  const res = await fetch(`${API_BASE}/cohorts`);
  return res.json();
}

export async function fetchMarketing() {
  const res = await fetch(`${API_BASE}/marketing`);
  return res.json();
}

export async function fetchForecast(horizon = 30) {
  const res = await fetch(`${API_BASE}/forecast?horizon=${horizon}`);
  return res.json();
}

export async function fetchChurn() {
  const res = await fetch(`${API_BASE}/churn`);
  return res.json();
}

export async function fetchSegmentation() {
  const res = await fetch(`${API_BASE}/segmentation`);
  return res.json();
}

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/anomalies`);
  return res.json();
}

export async function postAskData(query) {
  const res = await fetch(`${API_BASE}/ask-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return res.json();
}

export async function postSimulatePrice(category, price_delta_pct) {
  const res = await fetch(`${API_BASE}/simulate/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, price_delta_pct })
  });
  return res.json();
}

export async function postSimulateRetention(discount_pct) {
  const res = await fetch(`${API_BASE}/simulate/retention`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discount_pct })
  });
  return res.json();
}

export async function postSimulateMarketing(shift_amount_lakhs, from_channel, to_channel) {
  const res = await fetch(`${API_BASE}/simulate/marketing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shift_amount_lakhs, from_channel, to_channel })
  });
  return res.json();
}

export async function exportPowerBI() {
  const res = await fetch(`${API_BASE}/export-powerbi`);
  return res.json();
}

// Ingestion & BYOD API Endpoints
export async function fetchDataSources() {
  const res = await fetch(`${API_BASE}/ingestion/sources`);
  return res.json();
}

export async function uploadRawData(filename, raw_content) {
  const res = await fetch(`${API_BASE}/ingestion/upload-raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, raw_content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function uploadDataFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/ingestion/upload-file`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `File extraction failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function applySchemaMapping(file_id, mappings, dataset_name) {
  const res = await fetch(`${API_BASE}/ingestion/apply-mapping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id, mappings, dataset_name })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ingestion failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function loadPublicBenchmark(dataset_key) {
  const res = await fetch(`${API_BASE}/ingestion/load-public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_key })
  });
  return res.json();
}

export async function resetDemoDataset() {
  const res = await fetch(`${API_BASE}/ingestion/reset-demo`, {
    method: 'POST'
  });
  return res.json();
}

// Enterprise Data Workspace API Endpoints
export async function fetchWorkspaceCatalog() {
  const res = await fetch(`${API_BASE}/workspace/catalog`);
  return res.json();
}

export async function fetchDatasetVersions(datasetId) {
  const res = await fetch(`${API_BASE}/workspace/versions/${datasetId}`);
  return res.json();
}

export async function rollbackDatasetVersion(versionId) {
  const res = await fetch(`${API_BASE}/workspace/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version_id: versionId })
  });
  return res.json();
}

export async function compareDatasetVersions(versionAId, versionBId) {
  const res = await fetch(`${API_BASE}/workspace/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version_a_id: versionAId, version_b_id: versionBId })
  });
  return res.json();
}

export async function fetchAuditLog(limit = 50) {
  const res = await fetch(`${API_BASE}/workspace/audit-log?limit=${limit}`);
  return res.json();
}

export async function fetchDataLineage(metricKey = null) {
  const url = metricKey ? `${API_BASE}/workspace/lineage/${metricKey}` : `${API_BASE}/workspace/lineage`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchAnalysisRuns() {
  const res = await fetch(`${API_BASE}/workspace/analysis-runs`);
  return res.json();
}

export async function recordAnalysisRun(payload) {
  const res = await fetch(`${API_BASE}/workspace/run-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}


