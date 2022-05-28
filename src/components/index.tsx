import React, { useCallback, useEffect, useRef } from 'react';
import { render } from 'react-dom';
import styled from 'styled-components';

const Root = styled.div`
  width: 400px;
  height: 240px;
`;

const Inner = styled.div`
  padding: 16px;
`;

const Row = styled.div`
  display: flex;
  height: 50px;
  align-items: center;

  label {
    flex-basis: 30%;
  }
`;

const Input = styled.input`
  width: 100%;
`;

const ButtonBox = styled.div`
  display: flex;
  justify-content: center;

  > button:not(:first-child) {
    margin-left: 16px;
  }
`;

const Button = styled.button``;

const Index = () => {
  const inputRef = useRef<HTMLInputElement>(null);

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
    });
  }, []);

  return (
    <Inner>
      <Row>
        <label>テキスト</label>
        <Input ref={inputRef} type="text" />
      </Row>
      <ButtonBox>
        <Button onClick={onSaveClick}>保存</Button>
      </ButtonBox>
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
