const puppeteer = require('puppeteer');
const { getBudgetMetricsOfPage, getMatchedPageMetrics, getBudgetMetricByPageMetricName } = require('./helpers');

// Example page metrics
// [
//   { name: 'Timestamp', value: 66567.150449 },
//   { name: 'AudioHandlers', value: 0 },
//   { name: 'Documents', value: 8 },
//   { name: 'Frames', value: 3 },
//   { name: 'JSEventListeners', value: 34 },
//   { name: 'LayoutObjects', value: 455 },
//   { name: 'MediaKeySessions', value: 0 },
//   { name: 'MediaKeys', value: 0 },
//   { name: 'Nodes', value: 970 },
//   { name: 'Resources', value: 74 },
//   { name: 'ContextLifecycleStateObservers', value: 0 },
//   { name: 'V8PerContextDatas', value: 4 },
//   { name: 'WorkerGlobalScopes', value: 0 },
//   { name: 'UACSSResources', value: 0 },
//   { name: 'RTCPeerConnections', value: 0 },
//   { name: 'ResourceFetchers', value: 8 },
//   { name: 'AdSubframes', value: 0 },
//   { name: 'DetachedScriptStates', value: 2 },
//   { name: 'LayoutCount', value: 13 },
//   { name: 'RecalcStyleCount', value: 22 },
//   { name: 'LayoutDuration', value: 0.067929 },
//   { name: 'RecalcStyleDuration', value: 0.029508 },
//   { name: 'ScriptDuration', value: 0.122922 },
//   { name: 'V8CompileDuration', value: 0.003031 },
//   { name: 'TaskDuration', value: 0.336774 },
//   { name: 'TaskOtherDuration', value: 0.116415 },
//   { name: 'ThreadTime', value: 0.275266 },
//   { name: 'JSHeapUsedSize', value: 7816504 },
//   { name: 'JSHeapTotalSize', value: 11096064 },
//   { name: 'FirstMeaningfulPaint', value: 66565.452541 },
//   { name: 'DomContentLoaded', value: 66565.386449 },
//   { name: 'NavigationStart', value: 66564.624457 }
// ]

const assertMetricsOnUrl = async (siteUrl) => {
  const page = await this.browser.newPage();
  const protocol = await page.target().createCDPSession();
  await protocol.send('Performance.enable');

  await page.goto(siteUrl, { waitUntil: 'networkidle0' });
  const budgetMetrics = await getBudgetMetricsOfPage(page);
  const { metrics: pageMetrics } = await protocol.send('Performance.getMetrics');

  const matchedMetrics = getMatchedPageMetrics(pageMetrics, budgetMetrics);

  matchedMetrics.forEach(pageMetric => {
    expect(pageMetric.value).toBeLessThan(getBudgetMetricByPageMetricName(budgetMetrics, pageMetric));
  });

  await page.close();
};

beforeAll(async () => {
  this.browser = await puppeteer.launch();
});

afterAll(async () => {
  await this.browser.close();
});

test('asserts budget performance metrics on the main page', async() => {
  await assertMetricsOnUrl('https://www.linkit.nl/');
}, 30000);

test('asserts budget performance metrics on vacatures page', async() => {
  await assertMetricsOnUrl('https://www.linkit.nl/vacatures');
}, 30000);
