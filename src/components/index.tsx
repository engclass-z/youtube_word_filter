import React, { useCallback, useEffect, useRef } from 'react';
import { render } from 'react-dom';
import styled from 'styled-components';

const Root = styled.div`
  width: 400px;
  height: 300px;
`;

const Inner = styled.div`
  padding: 16px;
`;

const Row = styled.div`
  display: flex;
  // height: 50px;
  align-items: center;
  margin-top: 20px;

  div {
    width: 100%;
    text-align: center;
  }

  label {
    flex-basis: 30%;
    font-weight: 600;
  }
`;

const Text = styled.div`
  p {
    font-size: 14px;
    font-weight: 600;
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 0.5em;
`;

const ButtonBox = styled.div`
  display: flex;
  justify-content: center;

  > button:not(:first-child) {
    margin-left: 16px;
  }
`;

const Button = styled.button`
  font-weight: 600;
  margin-top: 20px;
`;

const Index = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const saved = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chrome.storage.local.get(['input']).then((value) => {
      if (!inputRef.current) return;

      const { input } = value;
      inputRef.current.value = input || '';
    });
  }, []);

  const onSaveClick = useCallback(() => {
    if (!inputRef.current) return;

    const input = inputRef.current.value;

    // 保存
    chrome.storage.local.set({ input }, () => {
      // なにか処理するのであればここで

      if (saved.current) {
        saved.current.innerText = '保存されました。';
      }
    });
  }, []);

  return (
    <Inner>
      <Row>
        <Text>
          <p>
            トップ画面から非表示にしたいコンテンツのキーワードを入力して下さい。
            （複数個のキーワードを指定する場合は、半角スペースで区切る）
          </p>
        </Text>
      </Row>
      <Row>
        <label>キーワード</label>
        <Input ref={inputRef} type="text" />
      </Row>
      <ButtonBox>
        <Button onClick={onSaveClick}>保存</Button>
      </ButtonBox>
      <Row>
        <div ref={saved}></div>
      </Row>
    </Inner>
  );
};

render(
  <React.StrictMode>
    <Root>
      <Index />
    </Root>
  </React.StrictMode>,
  document.getElementById('root')
);
