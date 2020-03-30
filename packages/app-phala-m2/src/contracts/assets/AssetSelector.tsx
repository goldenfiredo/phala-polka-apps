import React, { useState } from 'react';
import styled from 'styled-components';
import { Accordion, Icon } from 'semantic-ui-react'
import BN from 'bn.js';

import { I18nProps } from '@polkadot/react-components/types';
import { Dropdown, Modal, InputBalance, Input, Button, TxButton } from '@polkadot/react-components';
import { KeyringPair } from '@polkadot/keyring/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { formatBalance } from '@polkadot/util';

import Summary from '../../Summary';
import PRuntime, { encryptObj } from '../../pruntime';
import {EcdhChannel} from '../../pruntime/crypto';
import translate from '../../translate';

import * as Models from './models';
import { toApi } from '@polkadot/app-phala-m2/pruntime/models';

interface Props extends I18nProps {
  contractId: number;
  accountId: string | null;
  ecdhChannel: EcdhChannel | null;
  pRuntimeEndpoint: string;
  onChange: (asset: Models.AssetMetadata) => void;
}

const mockMetadata: Models.MetadataResp = {
  metadata: [
    {
      owner: 'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
      totalSupply: '1024000000000000',
      symbol: 'TTT',
      id: 0,
    },
    {
      owner: 'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
      totalSupply: '1024000000000000',
      symbol: 'PHA',
      id: 1,
    },
  ]
};

// for million, 2 * 3-grouping + comma
const M_LENGTH = 6 + 1;

function formatAssetBalance (asset: Models.AssetMetadata) {
  const [prefix, postfix] = formatBalance(asset.totalSupply, { forceUnit: '-', withSi: false }).split('.');

  if (prefix.length > M_LENGTH) {
    // TODO Format with balance-postfix
    return formatBalance(asset.totalSupply);
  }

  return <>{prefix}.<span className='balance-postfix'>{`000${postfix || ''}`.slice(-3)}</span></>;
}

type MetadataQueryResult = {Metadata: Models.MetadataResp};

const MetadataDetailContainer = styled.div`
  margin-left: 29px;
  margin-top: 5px;
  pre {
    overflow: scroll;
  }
`;

function AssetSelector ({ contractId, accountId, ecdhChannel, pRuntimeEndpoint, onChange, t }: Props): React.ReactElement<Props> {
  const [keypair, setKeypair] = useState<KeyringPair | null>(null);
  React.useEffect(() => {
    (async () => {
      await cryptoWaitReady();
      if (accountId) {
        const pair = keyring.getPair(accountId || '');
        setKeypair(pair);
      }
    })();
  }, [accountId]);

  const [queryResult, setQueryResult] = useState<MetadataQueryResult | null>({
    Metadata: mockMetadata
  });

  async function queryMetadata() {
    const result: object = await new PRuntime(pRuntimeEndpoint).query(
      contractId, 'Metadata', ecdhChannel!, keypair!);
    setQueryResult(result as MetadataQueryResult);
  }

  React.useEffect(() => {
    if (!keypair || !ecdhChannel || !ecdhChannel.core.agreedSecret || !ecdhChannel.core.remotePubkey) {
      return;
    }
    queryMetadata();
  }, [keypair, ecdhChannel])

  const [assetId, setAssetId] = useState<number | null>(null);

  function findAsset(result: Models.MetadataResp, id: number): Models.AssetMetadata | null {
    return result.metadata.find(m => m.id == id) || null;
  }

  function internalOnChange(i: number | null) {
    if (i == null) {
      return;
    }
    setAssetId(i);
    console.log(queryResult, i);
    const asset = findAsset(queryResult!.Metadata, i)!;
    onChange(asset);
  }

  const [expanded, setExpanded] = useState([false, false]);
  function toggleExpanded(i: number) {
    const v = [...expanded];
    v[i] = !expanded[i];
    setExpanded(v);
  }

  async function createCommand (obj: any): Promise<string> {
    if (!ecdhChannel) {
      return '';
    }
    console.log('obj', obj)
    const cipher = await encryptObj(ecdhChannel, obj);
    const apiCipher = toApi(cipher);
    return JSON.stringify({Cipher: apiCipher});
  }

  const [issueOpen, setIssueOpen] = useState(false);
  const [{isSymbolValid, symbol}, setSymbol] = useState({isSymbolValid: false, symbol: ''});
  const [totalSupply, setTotalSupply] = useState<BN | undefined>();
  const [commandIssue, setCommandIssue] = useState('');

  function validateSymbol (val: string) {
    if (!val.toLowerCase().match(/^[a-z]+$/)) {
      return 'bad-symbol';
    }
    if (val.length <= 2) {
      return 'too-short';
    }
    if (val.length > 9) {
      return 'too-long';
    }
    if (queryResult?.Metadata.metadata) {
      const tokens = queryResult.Metadata.metadata;
      if (tokens.find(t => t.symbol.toLowerCase() == val.toLowerCase())) {
        return 'conflict-symbol';
      }
    }
    return 'valid';
  }
  function _onChangeSymbol (symbol: string) {
    symbol = symbol.trim().toUpperCase();
    const valid = validateSymbol(symbol);
    console.log('symbol', symbol, valid);
    const isSymbolValid = (valid == 'valid');
    setSymbol({isSymbolValid, symbol});
  }
  React.useEffect(() => {
    if (!isSymbolValid || !totalSupply) {
      setCommandIssue('');
      return;
    }
    (async () => {
      const cmd = await createCommand({
        Issue: {
          symbol,
          total: totalSupply?.toString(),
        }
      });
      setCommandIssue(cmd);
    })();
  }, [isSymbolValid, symbol, totalSupply, ecdhChannel]);

  return (
    <section>
      <div className='ui--row'>
        <div className='large'>

          <Dropdown
            // className='medium'
            help={t('Select an issued asset on the blockchain')}
            isDisabled={!(queryResult?.Metadata?.metadata)}
            label={t('Select asset')}
            options={
              queryResult?.Metadata?.metadata.map((a: Models.AssetMetadata) => ({
                text: a.symbol,
                value: a.id
              })) || []
            }
            onChange={internalOnChange}
            value={assetId}

            labelExtra={
              <>
              {<label>{t('total supply')}</label>}
              {queryResult && assetId != null
               && formatAssetBalance(findAsset(queryResult.Metadata, assetId)!)
               || '-'}
              </>
            }
          />

          <MetadataDetailContainer>
            <Accordion fluid styled className='metadata-details'>
              <Accordion.Title
                active={expanded[0]}
                index={0}
                onClick={() => toggleExpanded(0)}
              >
                <Icon name='dropdown' /> Assets Metadata
              </Accordion.Title>
              <Accordion.Content active={expanded[0]}>
                <pre>{JSON.stringify(queryResult, undefined, 2)}</pre>
              </Accordion.Content>
              <Accordion.Title
                active={expanded[1]}
                index={1}
                onClick={() => toggleExpanded(1)}
              >
                <Icon name='dropdown' /> Operations
              </Accordion.Title>
              <Accordion.Content active={expanded[1]}>
                <button onClick={() => setIssueOpen(true)}>create token</button>
                <button>delete token</button>
              </Accordion.Content>
            </Accordion>
          </MetadataDetailContainer>
        </div>
        <Summary className='small'>Select an asset or issue your own asset.</Summary>
      </div>

      <Modal
        header={t('Create Token')}
        open={issueOpen}
        size='small'
      >
        <Modal.Content>
          <Input
            className='full'
            help={t('Enter the symbol of the token you will create.')}
            isError={!isSymbolValid}
            label={t('symbol')}
            onChange={_onChangeSymbol}
            value={symbol}
          />
          <InputBalance
            label={t('total supply')}
            onChange={setTotalSupply}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button.Group>
            <Button
              icon='cancel'
              isNegative
              label={t('Cancel')}
              onClick={() => {setIssueOpen(false)}}
            />
            <Button.Or />
            <TxButton
              isDisabled={!isSymbolValid || !totalSupply || !commandIssue}
              accountId={accountId}
              icon='send'
              label='submit'
              params={[contractId, commandIssue]}
              tx='execution.pushCommand'
              onSuccess={() => {setIssueOpen(false)}}
            />
          </Button.Group>
        </Modal.Actions>

      </Modal>
    </section>
  );
}

export default translate(AssetSelector);