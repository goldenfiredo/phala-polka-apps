// Copyright 2017-2019 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import BN from 'bn.js';
import React, { useState } from 'react';
import { Button, InputAddress, InputBalance, TxButton } from '@polkadot/react-components';

import {encryptObj} from './pruntime';
import Summary from './Summary';
import {toApi} from './pruntime/models'
import {ss58ToHex} from './utils';

interface Props {
  accountId?: string | null;
  ecdhPrivkey: CryptoKey | undefined,
  ecdhPubkey: CryptoKey | undefined,
  remoteEcdhPubkeyHex: string | undefined,
}

const kContractId = 2;

export default function Transfer ({ accountId, ecdhPrivkey, ecdhPubkey, remoteEcdhPubkeyHex }: Props): React.ReactElement<Props> {
  const [amount, setAmount] = useState<BN | undefined | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [command, setCommand] = useState('');

  React.useEffect(() => {
    if (!ecdhPrivkey || !ecdhPubkey || !remoteEcdhPubkeyHex || !recipientId || !amount) {
      return;
    }
    console.log('dest', recipientId);
    const pubkeyHex = ss58ToHex(recipientId);
    (async () => {
      const obj = {
        Transfer: {
          dest: pubkeyHex,
          value: amount.toString()
        }
      };
      console.log('obj', obj)
      const cipher = await encryptObj(ecdhPrivkey, ecdhPubkey, remoteEcdhPubkeyHex, obj);
      const apiCipher = toApi(cipher);
      setCommand(JSON.stringify({Cipher: apiCipher}));
    })()
  }, [ecdhPrivkey, ecdhPubkey, remoteEcdhPubkeyHex, recipientId, amount])

  return (
    <section>
      <h1>transfer</h1>
      <div className='ui--row'>
        <div className='large'>
          <InputAddress
            label='recipient address for this transfer'
            onChange={setRecipientId}
            type='all'
          />
          <InputBalance
            label='amount to transfer'
            onChange={setAmount}
          />
          <Button.Group>
            <TxButton
              accountId={accountId}
              icon='send'
              label='make transfer'
              params={[kContractId, command]}
              tx='execution.pushCommand'
            />
          </Button.Group>
        </div>
        <Summary className='small'>Make a transfer from any account you control to another account. Transfer fees and per-transaction fees apply and will be calculated upon submission.</Summary>
      </div>
    </section>
  );
}
