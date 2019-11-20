const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const bytesToMb = (bytes) => {
  return bytes/1e+6;
};

const getTimeFromPerformanceMetrics = (metrics, name) =>
  metrics.metrics.find(x => x.name === name).value * 1000;

const parsePerformanceMetrics = (metrics, ...metricNames) => {
  const parsedData = {};
  const navigationStart = getTimeFromPerformanceMetrics(
    metrics,
    'NavigationStart'
  );

  metricNames.forEach(metricName => {
    parsedData[metricName] =
      getTimeFromPerformanceMetrics(metrics, metricName) - navigationStart;
  });

  return parsedData;
};

const getCustomMetric = (page, metricName) =>
  new Promise(resolve =>
    page.on('metrics', ({ title, metrics }) => {
      if (title === metricName) {
        resolve(metrics.Timestamp * 1000);
      }
    })
  );

const getPath = (page) => {
  return page.evaluate(() => document.location.pathname);
};

const getBudgetMetrics = async () => {
  const budgetMetrics = await readFileAsync('./budget.json', { encoding: 'utf8' });
  return JSON.parse(budgetMetrics);
};

const getBudgetMetricsForPath = async (path) => {
  const metrics = await getBudgetMetrics();
  const metricForPath = metrics.find(metric => metric.path === path);

  if (metricForPath) {
    return metricForPath.perfMetrics;
  }

  return null;
};

const getBudgetMetricsOfPage = async (page) => {
  const path = await getPath(page);
  return getBudgetMetricsForPath(path);
};

const getMatchedPageMetrics = (pageMetrics, budgetMetrics) => {
  return pageMetrics.filter((pageMetric) =>
    budgetMetrics.some(budgetMetric => budgetMetric.metric === pageMetric.name));
};

const getBudgetMetricByPageMetricName = (budgetMetrics, pageMetric) => {
  return budgetMetrics.find(budgetMetric => budgetMetric.metric === pageMetric.name).budget
};

module.exports = {
  getBudgetMetricByPageMetricName,
  getTimeFromPerformanceMetrics,
  parsePerformanceMetrics,
  getBudgetMetricsOfPage,
  getBudgetMetricsForPath,
  getMatchedPageMetrics,
  getBudgetMetrics,
  getCustomMetric,
  bytesToMb,
  getPath
};
