import { Balance } from '@polkadot/react-components';
import { KeyringPair } from '@polkadot/keyring/types';

import React from 'react';
import BN from 'bn.js';

import Transfer from "@polkadot/app-phala-m2/Transfer";
import Query from "@polkadot/app-phala-m2/Query";
import { EcdhChannel } from '@polkadot/app-phala-m2/pruntime/crypto';
import { ss58ToHex } from '@polkadot/app-phala-m2/utils';

interface Props {
  accountId: string | null;
  ecdhChannel: EcdhChannel | null;
  pRuntimeEndpoint: string;
  keypair: KeyringPair | null;
}

export default function BalancesTab ({accountId, ecdhChannel, pRuntimeEndpoint, keypair}: Props): React.ReactElement<Props> {
  const queryPlan = [{
    query: 'TotalIssuance',
    buttons: [{
      props: {
        label: 'TotalIssuance',
        icon: 'money bill alternate outline',
        isPrimary: true,
        isNegative: false,
      }
    }],
    bubble: {
      props: {
        label: 'total issuance',
        color: 'teal',
        icon: 'money bill alternate outline',
      },
      render (result: any) {
        return (<Balance balance={new BN(result.totalIssuance)} params={'dummy'} />);
      }
    }
  }, {
    query: 'FreeBalance',
    buttons: [{
        props: {
          label: 'FreeBalance',
          icon: 'search',
          isPrimary: true,
          isNegative: false,
        },
        getPayload() {
          return { account: ss58ToHex(accountId!) }
        },
      }, {
        props: {
          label: 'FreeBalance for Bob',
          icon: 'search',
          isPrimary: false,
          isNegative: true,
        },
        getPayload() {
          return { account: ss58ToHex('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty') }
        },
      }],
    bubble: {
      props: {
        label: 'balance',
        color: 'yellow',
        icon: 'adjust',
      },
      render (result: any) {
        return (<Balance balance={new BN(result.balance)} params={'dummy'} />);
      }
    }
  }];

  return (
    <>
      <h1>Balances</h1>
      <Transfer
        assets={false}
        accountId={accountId}
        ecdhChannel={ecdhChannel}
      />
      <Query
        contractId={2}
        accountId={accountId}
        ecdhChannel={ecdhChannel}
        pRuntimeEndpoint={pRuntimeEndpoint}
        plans={queryPlan}
        keypair={keypair}
      />
    </>
  );
}