import './index.scss';

// 保存してある語句を読み込み
chrome.storage.local.get(['input']).then((value) => {
  const { input } = value;
  console.log(input);
});
