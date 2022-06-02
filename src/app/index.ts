import Tab = chrome.tabs.Tab;
import './index.scss';

const TARGET_API = 'https://www.youtube.com/youtubei/v1/browse*';

/**
 * バイナリ文字列を返す
 */
const makeBinaryString = (value: string) => {
  return btoa(unescape(encodeURIComponent(value)));
};

/**
 * ヘッダ文字列を返す
 */
const getHeaderString = (headers: Headers) => {
  let responseHeader = '';
  headers.forEach((header, key) => {
    responseHeader += key + ':' + header + '\n';
  });
  return responseHeader.replace(/(?:\r\n|\r|\n)/g, '\0');
};

/**
 * 書き換えられた body を返す
 * YouTube の内部 API に干渉しているので、仕様変更が合った場合には対応できないかもしれません
 */
const getRewritedResponse = async (text: string): Promise<string> => {
  const values = await chrome.storage.local.get('input');
  if (!values || !values.input) return text;

  const words: string[] = values.input.split(' ');
  const obj = JSON.parse(text);
  const items = obj.onResponseReceivedActions[0]?.appendContinuationItemsAction.continuationItems;
  if (!items) return text;
  obj.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems = items.filter(
    (item: any) => {
      try {
        const title: string =
          item.richItemRenderer.content.videoRenderer.title.accessibility.accessibilityData.label;
        return !words.some((word) => title.includes(word));
      } catch (_) {
        return true;
      }
    }
  );
  return JSON.stringify(obj);
};

/**
 * 差し替えリクエストを行う
 */
const tryReplacedRequest = async (
  url: string,
  headers: any,
  method: string,
  postData: string,
  success: (response: string, headers: string) => void,
  error: () => void
) => {
  const response = await fetch(url, {
    method,
    mode: 'same-origin',
    headers,
    redirect: 'follow',
    body: postData,
  });

  const responseText = await response.text();
  const responseHeaders = getHeaderString(response.headers);
  if (response.ok) {
    success(await getRewritedResponse(responseText), responseHeaders);
  } else {
    error();
  }
};

/**
 * 現在表示しているタブにイベントを設定する
 */
const setupTabEvent = (target: Tab | null) => {
  if (!target) return;

  chrome.debugger.onEvent.addListener(async (source, chromeMethod, params: any) => {
    if (!params) return;
    if (source.tabId !== target.id) return;
    if (chromeMethod !== 'Fetch.requestPaused') return;

    const { request, requestId }: { request: any; requestId: string } = params;
    const { url, headers, method, postData } = request;
    const continueParams = { requestId };

    // 変換データがなければそのまま素通し
    const values = await chrome.storage.local.get('input');
    if (!values || !values.input) {
      chrome.debugger
        .sendCommand({ tabId: target.id }, 'Fetch.continueRequest', continueParams)
        .then(() => {});
      return;
    }

    tryReplacedRequest(
      url,
      headers,
      method,
      postData,
      (response, headers) => {
        // 成功時はレスポンスを書き換える
        chrome.debugger.sendCommand({ tabId: target.id }, 'Fetch.fulfillRequest', {
          ...continueParams,
          responseCode: 200,
          binaryResponseHeaders: makeBinaryString(headers),
          body: makeBinaryString(response),
        });
      },
      () => {
        // 失敗時はそのまま素通し
        chrome.debugger.sendCommand({ tabId: target.id }, 'Fetch.continueRequest', continueParams);
      }
    ).then(() => {});
  });

  chrome.debugger.attach({ tabId: target.id }, '1.0', () => {
    chrome.debugger
      .sendCommand({ tabId: target.id }, 'Fetch.enable', {
        patterns: [{ urlPattern: TARGET_API }],
      })
      .then(() => {});
  });
};

/**
 * タブのアクティブ状態が切り替わった時に発動
 * @see https://developer.chrome.com/docs/extensions/reference/tabs/#event-onActivated
 */
chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
    setupTabEvent(tab[0]);
  });
});
